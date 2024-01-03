import { useEffect } from "react";
import { AnalyticsData, QuoteResponse } from "./types";
import BN from "bignumber.js";
const ANALYTICS_VERSION = 0.1;
const BI_ENDPOINT = `https://bi.orbs.network/putes/liquidity-hub-ui-${ANALYTICS_VERSION}`;
const DEX_PRICE_BETTER_ERROR = "Dex trade is better than Clob trade";

export const useAnalytics = (partner: string, chainId?: number) => {
  useEffect(() => {
    analytics.data.chainId = chainId;
    analytics.data.partner = partner;
  }, [partner, chainId]);
};

const initialData: Partial<AnalyticsData> = {
  _id: crypto.randomUUID(),
  partner: "",
  chainId: undefined,
  isClobTrade: false,
  isNotClobTradeReason: "null",
  firstFailureSessionId: "null",
  clobDexPriceDiffPercent: "null",
  quoteIndex: 0,
  "quote-1-state": "null",
  approvalState: "null",
  "quote-2-state": "null",
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

// const counter = () => {
//   const now = Date.now();

//   return () => {
//     return Date.now() - now;
//   };
// };

class Analytics {
  initialTimestamp = Date.now();
  data = initialData;
  firstFailureSessionId = "";
  abortController = new AbortController();

  private updateAndSend(values = {} as Partial<AnalyticsData>) {
    try {
      this.abortController.abort();
      this.abortController = new AbortController();
      this.data = { ...this.data, ...values };
      fetch(BI_ENDPOINT, {
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

  incrementQuoteIndex() {
    this.updateAndSend({
      quoteIndex: !this.data.quoteIndex ? 1 : this.data.quoteIndex + 1,
    });
  }

  onQuoteRequest() {
    this.updateAndSend({ [`quote-${this.data.quoteIndex}-state`]: "pending" });
  }

  onQuoteSuccess(quoteResponse: QuoteResponse, time: number) {
    this.updateAndSend({ [`quote-${this.data.quoteIndex}-state`]: "success" });
    this.onQuoteData(quoteResponse, time);
  }

  onQuoteFailed(error: string, time: number, quoteResponse?: QuoteResponse) {
    if (error == DEX_PRICE_BETTER_ERROR) {
      this.updateAndSend({
        isNotClobTradeReason: DEX_PRICE_BETTER_ERROR,
        [`quote-${this.data.quoteIndex}-state`]: "success",
      });
    } else {
      this.updateAndSend({
        [`quote-${this.data.quoteIndex}-error`]: error,
        [`quote-${this.data.quoteIndex}-state`]: "failed",
        isNotClobTradeReason: `quote-${this.data.quoteIndex}-failed`,
      });
    }

    this.onQuoteData(quoteResponse, time);
  }

  onQuoteData(quoteResponse?: QuoteResponse, time?: number) {
    const getDiff = () => {
      if (!quoteResponse?.outAmount || !this.data.dexAmountOut) {
        return "";
      }
      return new BN(quoteResponse?.outAmount).dividedBy(new BN(this.data.dexAmountOut)).minus(1).multipliedBy(100).toFixed(2);
    };

    this.updateAndSend({
      [`quote-${this.data.quoteIndex}-amount-out`]: quoteResponse?.outAmount,
      [`quote-${this.data.quoteIndex}-permit-data`]: quoteResponse?.permitData,
      [`quote-${this.data.quoteIndex}-serialized-order`]: quoteResponse?.serializedOrder,
      [`quote-${this.data.quoteIndex}-quote-call-data`]: quoteResponse?.callData,
      [`quote-${this.data.quoteIndex}-quote-millis`]: time,
      [`quote-${this.data.quoteIndex}-quote-raw-data`]: quoteResponse?.rawData,
      clobDexPriceDiffPercent: getDiff(),
    });
  }

  onApprovedBeforeTheTrade(userWasApprovedBeforeTheTrade: boolean) {
    this.updateAndSend({ userWasApprovedBeforeTheTrade });
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

  onWrapSuccess(txHash: string, time: number) {
    this.updateAndSend({
      wrapTxHash: txHash,
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
      ...initialData,
      _id: crypto.randomUUID(),
      firstFailureSessionId: this.firstFailureSessionId,
    };
  }

  async pollTransaction({ response, onSucess, onFailed }: { response: any; onSucess: () => void; onFailed: () => void }) {
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
    this.firstFailureSessionId = this.firstFailureSessionId || this.data.sessionId || "";
  }
}

export const analytics = new Analytics();
