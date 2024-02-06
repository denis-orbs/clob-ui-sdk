import { hasWeb3Instance, web3 } from "@defi.org/web3-candies";
import BN from "bignumber.js";
import { amountBN, amountUi } from "..";

import { QuoteResponse } from "../types";
import { waitForTxReceipt } from "../utils";
import { AnalyticsData, InitDexTrade, InitTrade } from "./types";
const ANALYTICS_VERSION = 0.2;
const BI_ENDPOINT = `https://bi.orbs.network/putes/liquidity-hub-ui-${ANALYTICS_VERSION}`;
const DEX_PRICE_BETTER_ERROR = "Dex trade is better than Clob trade";

const initialData: Partial<AnalyticsData> = {
  _id: crypto.randomUUID(),
  isClobTrade: false,
  isNotClobTradeReason: "null",
  firstFailureSessionId: "null",
  clobDexPriceDiffPercent: "null",
  quoteIndex: 0,
  quoteState: "null",
  approvalState: "null",
  signatureState: "null",
  swapState: "null",
  wrapState: "null",
  onChainClobSwapState: "null",
  onChainDexSwapState: "null",
  dexSwapState: "null",
  dexSwapError: "null",
  dexSwapTxHash: "null",
  userWasApprovedBeforeTheTrade: "null",
  isForceClob: false,
  isDexTrade: false,
  version: ANALYTICS_VERSION,
};

const initSwap = (args: InitTrade) => {
  const srcToken = args.fromToken;
  const dstToken = args.toToken;
  if (!srcToken || !dstToken) {
   return 
  }
  const dstTokenUsdValue = new BN(args.dstTokenUsdValue || "0");
  const dexAmountOut = args.dexAmountOut
    ? args.dexAmountOut
    : amountBN(dstToken?.decimals, args.dexAmountOutUI || "0").toString();

  const outAmount = args.tradeOutAmount ? args.tradeOutAmount : dexAmountOut;
  let dstAmountOutUsd = 0;
  try {
    dstAmountOutUsd = new BN(outAmount || "0")
      .multipliedBy(dstTokenUsdValue || 0)
      .dividedBy(new BN(10).pow(new BN(dstToken?.decimals || 0)))
      .toNumber();
  } catch (error) {
    console.log(error);
  }

  return {
    dexAmountOut,
    dexAmountOutUI: Number(amountUi(dstToken.decimals, new BN(dexAmountOut))),
    dstAmountOutUsd,
    srcTokenAddress: srcToken?.address,
    srcTokenSymbol: srcToken?.symbol,
    dstTokenAddress: dstToken?.address,
    dstTokenSymbol: dstToken?.symbol,
    srcAmount: args.srcAmount
      ? amountUi(srcToken.decimals, new BN(args.srcAmount))
      : args.srcAmountUI,
    slippage: args.slippage,
    walletAddress: args.walletAddress,
    tradeType: args.tradeType
  };
};

export class Analytics {
  initialTimestamp = Date.now();
  data = {} as Partial<AnalyticsData>;
  firstFailureSessionId = "";
  abortController = new AbortController();

  setPartner(partner: string) {
    this.data.partner = partner;
  }

  setChainId(chainId: number) {
    this.data.chainId = chainId;
  }

  public async updateAndSend(values = {} as Partial<AnalyticsData>) {
    console.log(values, this.data);
    
    const chainId = values.chainId || this.data.chainId;
    const partner = values.partner || this.data.partner;
    if (!chainId || !partner) {
      console.error("Missng chain or partner");
      return;
    }
    try {
      this.abortController.abort();
      this.abortController = new AbortController();
      this.data = { ...this.data, ...values };
      await fetch(BI_ENDPOINT, {
        method: "POST",
        signal: this.abortController.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.data),
      });
    } catch (error) {
      console.log("Analytics error", error);
    }
  }

  onInitSwap(args: InitTrade) {
    if (!this.data.chainId) return;
    const result = initSwap(args);
    this.updateAndSend(result);
  }

  onQuoteRequest() {
    this.data = {
      ...this.data,
      quoteState: "pending",
      quoteIndex: !this.data.quoteIndex ? 1 : this.data.quoteIndex + 1,
    };
  }

  onQuoteSuccess(quoteMillis: number, quoteResponse: QuoteResponse) {
    this.data = {
      ...this.data,
      quoteState: "success",
      quoteMillis,
      ...this.handleQuoteData(quoteResponse),
    };
  }

  onQuoteFailed(
    error: string,
    quoteMillis: number,
    quoteResponse?: QuoteResponse
  ) {
    // we not treat DEX_PRICE_BETTER_ERROR as a failure
    if (error == DEX_PRICE_BETTER_ERROR) {
      this.data = {
        ...this.data,
        isNotClobTradeReason: DEX_PRICE_BETTER_ERROR,
        quoteState: "success",
        quoteMillis,
        ...this.handleQuoteData(quoteResponse),
      };
    } else {
      this.data = {
        ...this.data,
        quoteError: error,
        quoteState: "failed",
        isNotClobTradeReason: `quote-failed`,
        quoteMillis,
        ...this.handleQuoteData(quoteResponse),
      };
    }
  }

  handleQuoteData(quoteResponse?: QuoteResponse): Partial<AnalyticsData> {
    const getDiff = () => {
      if (!quoteResponse?.outAmount || !this.data.dexAmountOut) {
        return "";
      }
      return new BN(quoteResponse?.outAmount)
        .dividedBy(new BN(this.data.dexAmountOut))
        .minus(1)
        .multipliedBy(100)
        .toFixed(2);
    };

    return {
      quoteAmountOut: quoteResponse?.outAmount,
      quoteSerializedOrder: quoteResponse?.serializedOrder,
      clobDexPriceDiffPercent: getDiff(),
    };
  }

  onApprovedBeforeTheTrade(userWasApprovedBeforeTheTrade?: boolean) {
    this.updateAndSend({
      userWasApprovedBeforeTheTrade: Boolean(userWasApprovedBeforeTheTrade),
    });
  }

  onApprovalRequest() {
    this.updateAndSend({ approvalState: "pending" });
  }

  onApprovalSuccess(time: number) {
    this.updateAndSend({ approvalMillis: time, approvalState: "success" });
  }

  onApprovalFailed(error: string, time: number) {
    this.updateAndSend({
      approvalError: error,
      approvalState: "failed",
      approvalMillis: time,
      isNotClobTradeReason: "approval failed",
    });
  }

  onSignatureRequest() {
    this.updateAndSend({ signatureState: "pending" });
  }

  onWrapRequest() {
    this.updateAndSend({ wrapState: "pending" });
  }

  onWrapSuccess(time: number) {
    this.updateAndSend({
      wrapMillis: time,
      wrapState: "success",
    });
  }

  onWrapFailed(error: string, time: number) {
    this.updateAndSend({
      wrapError: error,
      wrapState: "failed",
      wrapMillis: time,
      isNotClobTradeReason: "wrap failed",
    });
  }

  onSignatureSuccess(signature: string, time: number) {
    this.updateAndSend({
      signature,
      signatureMillis: time,
      signatureState: "success",
    });
  }

  onSignatureFailed(error: string, time: number) {
    this.updateAndSend({
      signatureError: error,
      signatureState: "failed",
      signatureMillis: time,
      isNotClobTradeReason: "signature failed",
    });
  }

  onSwapRequest() {
    this.updateAndSend({ swapState: "pending" });
  }

  onSwapSuccess(txHash: string, time: number) {
    this.updateAndSend({
      txHash,
      swapMillis: time,
      swapState: "success",
      isClobTrade: true,
      onChainClobSwapState: "pending",
    });
  }

  onSwapFailed(error: string, time: number, onChainFailure: boolean) {
    this.updateAndSend({
      swapError: error,
      swapState: "failed",
      swapMillis: time,
      isNotClobTradeReason: onChainFailure
        ? "onchain swap error"
        : "swap failed",
      onChainClobSwapState: onChainFailure ? "failed" : "null",
    });
  }

  setSessionId(id: string) {
    this.data.sessionId = id;
  }

  clearState() {
    this.data = {
      ...initialData,
      partner: this.data.partner,
      chainId: this.data.chainId,
      _id: crypto.randomUUID(),
      firstFailureSessionId: this.firstFailureSessionId,
    };
  }

  async onClobOnChainSwapSuccess() {
    this.updateAndSend({ onChainClobSwapState: "success" });
  }

  onNotClobTrade(message: string) {
    this.updateAndSend({ isNotClobTradeReason: message });
  }

  onClobFailure() {
    this.firstFailureSessionId =
      this.firstFailureSessionId || this.data.sessionId || "";
  }
}

const _analytics = new Analytics();

function onDexSwapRequest() {
  _analytics.updateAndSend({ dexSwapState: "pending", isDexTrade: true });
}

async function onDexSwapSuccess(dexSwapTxHash?: string) {
  _analytics.updateAndSend({
    dexSwapState: "success",
    dexSwapTxHash,
  });
  if (!dexSwapTxHash || !hasWeb3Instance()) return;
  const res = await waitForTxReceipt(web3(), dexSwapTxHash);

  _analytics.updateAndSend({
    onChainDexSwapState: res?.mined ? "success" : "failed",
  });
}
function onDexSwapFailed(dexSwapError: string) {
  _analytics.updateAndSend({ dexSwapState: "failed", dexSwapError });
}

const initDexSwap = (args: InitDexTrade) => {
  const result = initSwap(args);
  _analytics.updateAndSend({ ...result, partner: args.partner, chainId: args.chainId });
};

// for dex
export const analytics = {
  onSwapRequest: onDexSwapRequest,
  onSwapSuccess: onDexSwapSuccess,
  onSwapFailed: onDexSwapFailed,
  initSwap: initDexSwap,
};
