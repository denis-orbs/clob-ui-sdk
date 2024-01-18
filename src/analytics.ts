import { hasWeb3Instance, web3 } from "@defi.org/web3-candies";
import BN from "bignumber.js";
import { amountBN, amountUi } from "./lib";
import { partners } from "./lib/config";

import {
  AnalyticsData,
  AnalyticsInitTradeArgs,
  QuoteResponse,
} from "./lib/types";
import { waitForTxReceipt } from "./lib/utils";
const ANALYTICS_VERSION = 0.2;
const BI_ENDPOINT = `https://bi.orbs.network/putes/liquidity-hub-ui-${ANALYTICS_VERSION}`;
const DEX_PRICE_BETTER_ERROR = "Dex trade is better than Clob trade";

const initialData = (
  partner?: string,
  chainId?: number
): Partial<AnalyticsData> => {
  return {
    _id: crypto.randomUUID(),
    partner,
    chainId,
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
};

class Analytics {
  initialTimestamp = Date.now();
  data = {} as Partial<AnalyticsData>;
  firstFailureSessionId = "";
  abortController = new AbortController();

  public async updateAndSend(values = {} as Partial<AnalyticsData>) {
    if (!this.data.chainId || !this.data.partner) return;
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
  init(partner?: string, chainId?: number) {
    this.data = initialData(partner, chainId);
  }

  onInitSwap(args: AnalyticsInitTradeArgs) {
    const partner = partners[args.partner];
    const srcToken = partner.normalizeToken(args.fromToken);
    const dstToken = partner.normalizeToken(args.toToken);
    const dstTokenUsdValue = new BN(args.dstTokenUsdValue || "0");
    const dexAmountOut = args.dexAmountOut
      ? args.dexAmountOut
      : amountBN(dstToken, args.dexAmountOutUI || "0").toString();

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

    this.updateAndSend({
      dexAmountOut,
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
      tradeType: args.tradeType,
    });
  }

  onQuoteRequest(dexAmountOut?: string) {
    this.updateAndSend({
      quoteState: "pending",
      quoteIndex: !this.data.quoteIndex ? 1 : this.data.quoteIndex + 1,
      dexAmountOut,
    });
  }

  onQuoteSuccess(time: number, quoteResponse: QuoteResponse) {
    this.updateAndSend({
      quoteState: "success",
      ...this.handleQuoteData(quoteResponse, time),
    });
  }

  onQuoteFailed(error: string, time: number, quoteResponse?: QuoteResponse) {
    // we not treat DEX_PRICE_BETTER_ERROR as a failure
    if (error == DEX_PRICE_BETTER_ERROR) {
      this.updateAndSend({
        isNotClobTradeReason: DEX_PRICE_BETTER_ERROR,
        quoteState: "success",
        ...this.handleQuoteData(quoteResponse, time),
      });
    } else {
      this.updateAndSend({
        quoteError: error,
        quoteState: "failed",
        isNotClobTradeReason: `quote-failed`,
        ...this.handleQuoteData(quoteResponse, time),
      });
    }
  }

  handleQuoteData(
    quoteResponse?: QuoteResponse,
    time?: number
  ): Partial<AnalyticsData> {
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
      quoteMillis: time,
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

  onDexSwapRequest() {
    this.updateAndSend({ dexSwapState: "pending", isDexTrade: true });
  }

  async onDexSwapSuccess(dexSwapTxHash?: string) {
    this.updateAndSend({
      dexSwapState: "success",
      dexSwapTxHash,
    });
    if (!dexSwapTxHash || !hasWeb3Instance()) return;
    const res = await waitForTxReceipt(web3(), dexSwapTxHash);

    this.updateAndSend({
      onChainDexSwapState: res?.mined ? "success" : "failed",
    });
  }
  onDexSwapFailed(dexSwapError: string) {
    this.updateAndSend({ dexSwapState: "failed", dexSwapError });
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

  onForceClob() {
    this.updateAndSend({ isForceClob: true });
  }

  onIsProMode() {
    this.updateAndSend({ isProMode: true });
  }

  onExpertMode() {
    this.updateAndSend({ expertMode: true });
  }

  clearState() {
    this.data = {
      ...initialData(this.data.partner, this.data.chainId),
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

export const analytics = new Analytics();

export const onDexSwapSuccess = (txHash?: string) =>
  analytics.onDexSwapSuccess(txHash);
export const onInitSwap = (args: AnalyticsInitTradeArgs) =>
  analytics.onInitSwap(args);
export const onDexSwapFailed = (msg: string) => analytics.onDexSwapFailed(msg);
export const onDexSwapRequest = () => analytics.onDexSwapRequest();
