import BN from "bignumber.js";
import { useCallback } from "react";
import { usePartner } from "./hooks";
import { useLHContext } from "./lib";
import {
  AnalyticsData,
  AnalyticsInitTradeArgs,
  QuoteResponse,
  Token,
} from "./lib/types";
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

// const counter = () => {
//   const now = Date.now();

//   return () => {
//     return Date.now() - now;
//   };
// };

class Analytics {
  initialTimestamp = Date.now();
  data = {} as Partial<AnalyticsData>;
  firstFailureSessionId = "";
  abortController = new AbortController();

  private async  updateAndSend(values = {} as Partial<AnalyticsData>) {
    if(!this.data.chainId || !this.data.partner) return 
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

  onInitSwap({
    dexAmountOut,
    srcToken,
    dstToken,
    srcAmount,
    slippage,
    walletAddress,
    dstTokenUsdValue,
  }: AnalyticsInitTradeArgs) {
    const dstAmountOutUsd = new BN(dexAmountOut || "0")
      .multipliedBy(dstTokenUsdValue || 0)
      .dividedBy(new BN(10).pow(new BN(dstToken?.decimals || 0)))
      .toNumber();

    this.updateAndSend({
      dexAmountOut,
      dstAmountOutUsd,
      srcTokenAddress: srcToken?.address,
      srcTokenSymbol: srcToken?.symbol,
      dstTokenAddress: dstToken?.address,
      dstTokenSymbol: dstToken?.symbol,
      srcAmount,
      slippage,
      walletAddress,
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

  onDexSwapSuccess(response: any) {
    this.updateAndSend({
      dexSwapState: "success",
      dexSwapTxHash: response.hash,
    });

    this.pollTransaction({
      response,
      onSucess: () => {
        this.updateAndSend({ onChainDexSwapState: "success" });
      },
      onFailed: () => {
        this.updateAndSend({ onChainDexSwapState: "failed" });
      },
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

  onSwapFailed(error: string, time: number) {
    this.updateAndSend({
      swapError: error,
      swapState: "failed",
      swapMillis: time,
      isNotClobTradeReason: "swap failed",
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

  async pollTransaction({
    response,
    onSucess,
    onFailed,
  }: {
    response: any;
    onSucess: () => void;
    onFailed: () => void;
  }) {
    try {
      const receipt = await response.wait();
      if (receipt.status === 1) {
        onSucess();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      onFailed();
    }
  }

  async onClobSuccess(response: any) {
    this.pollTransaction({
      response,
      onSucess: () => {
        this.updateAndSend({ onChainClobSwapState: "success" });
      },
      onFailed: () => {
        {
          this.updateAndSend({
            onChainClobSwapState: "failed",
            isNotClobTradeReason: "onchain swap error",
          });
        }
      },
    });
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

interface InitSwapHookArgs {
  srcToken: Token;
  dstToken: Token;
  dexAmountOut?: string;
  dstTokenUsdValue?: string;
  srcAmount?: string;
  quoteOutAmount?: string;
}

export const useLiquidityHubAnalytics = () => {
  const { account, slippage } = useLHContext();
  const partner = usePartner();
  const initSwap = useCallback(
    (args: InitSwapHookArgs) => {
      analytics.onInitSwap({
        walletAddress: account,
        slippage,
        dexAmountOut: args.dexAmountOut,
        srcToken: args.srcToken,
        dstToken: args.dstToken,
        dstTokenUsdValue: args.dstTokenUsdValue,
        srcAmount: args.srcAmount,
        quoteOutAmount: args.quoteOutAmount,
      });
    },
    [account, slippage, partner]
  );

  return {
    initSwap,
  };
};
