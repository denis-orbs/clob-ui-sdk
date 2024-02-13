import { useCallback, useMemo } from "react";
import { amountBN, useTradeOwner } from "..";
import { useSwapState } from "../../store";
import { ConfirmSwapCallback, QuoteResponse, TradeOwner, UseConfirmSwap, UseLiquidityHubArgs } from "../types";
import { deductSlippage } from "../utils";
import { useAllowance } from "./useAllowance";
import { useQuote } from "./useQuote";
import BN from "bignumber.js";
import { swapAnalytics } from "../analytics";
const useAnalyticsInit = ({
  args,
  quote,
  tradeOwner,
}: {
  args: UseLiquidityHubArgs;
  quote?: QuoteResponse;
  tradeOwner?: TradeOwner;
}) => {
  const fromAmount = useFromAmountWei(args);
  const dexAmountOut = useDexAmountOutWei(args);
  const toAmount = tradeOwner === "dex" ? dexAmountOut : quote?.outAmount;

  return useCallback(() => {
    if (!args.fromToken || !args.toToken || !fromAmount) return;
    swapAnalytics.onInitSwap({
      fromToken: args.fromToken,
      toToken: args.toToken,
      dexAmountOut,
      dstTokenUsdValue: args.toTokenUsd,
      srcAmount: fromAmount,
      slippage: args.slippage,
      tradeType: "BEST_TRADE",
      tradeOutAmount: toAmount,
    });
  }, [
    args.fromToken,
    args.toToken,
    dexAmountOut,
    args.toTokenUsd,
    fromAmount,
    quote,
    args.slippage,
    tradeOwner,
    toAmount,
  ]);
};

const useFromAmountWei = (args: UseLiquidityHubArgs) => {
  return useMemo(() => {
    if ((!args.fromAmount && !args.fromAmountUI) || !args.fromToken) {
      return "0";
    }
    return args.fromAmount
      ? args.fromAmount
      : amountBN(args.fromToken.decimals, args.fromAmountUI || "0").toString();
  }, [args.fromAmount, args.fromAmountUI, args.fromToken]);
};

const useDexAmountOutWei = (args: UseLiquidityHubArgs) => {
  return useMemo(() => {
    if ((!args.dexAmountOut && !args.dexAmountOutUI) || !args.toToken) {
      return "0";
    }
    const value = args.dexAmountOut
      ? args.dexAmountOut
      : amountBN(args.toToken.decimals, args.dexAmountOutUI || "0").toString();

    if (!args.ignoreSlippage) {
      return deductSlippage(value, args.slippage);
    }
    return value;
  }, [
    args.dexAmountOut,
    args.dexAmountOutUI,
    args.toToken,
    args.ignoreSlippage,
    args.slippage,
  ]);
};



const useConfirmSwap = ({ args, quote, tradeOwner }: UseConfirmSwap) => {
  const fromAmount = useFromAmountWei(args);
  const dexAmountOut = useDexAmountOutWei(args);
  const updateState = useSwapState((s) => s.updateState);

  return useCallback(
    (callbackArgs: ConfirmSwapCallback) => {
      if (!args.fromToken) {
        console.error("from token missing");
        return;
      }
      if (!args.toToken) {
        console.error("to token missing");
        return;
      }

      if (!fromAmount) {
        console.error("from amount missing");
        return;
      }
      updateState({
        fromToken: args.fromToken,
        toToken: args.toToken,
        fromAmount,
        fromTokenUsd: args.fromTokenUsd,
        toTokenUsd: args.toTokenUsd,
        quote,
        showWizard: true,
        onSuccessDexCallback: callbackArgs.onSuccess,
        dexFallback: callbackArgs.fallback,
      });
    },
    [
      args.fromToken,
      args.toToken,
      fromAmount,
      args.fromTokenUsd,
      args.toTokenUsd,
      quote,
      tradeOwner,
      updateState,
      dexAmountOut,
    ]
  );
};




export const useLiquidityHub = (args: UseLiquidityHubArgs) => {
  const { slippage, swapTypeIsBuy, toToken, fromToken } = args;
  const { swapStatus, swapError } = useSwapState((store) => ({
    swapStatus: store.swapStatus,
    swapError: store.swapError,
    updateState: store.updateState,
  }));

  const fromAmount = useFromAmountWei(args);
  const dexAmountOut = useDexAmountOutWei(args);

  const quoteQuery = useQuote({
    fromToken,
    toToken,
    fromAmount,
    dexAmountOut,
    slippage,
    swapTypeIsBuy,
  });

  // prefetching allowance
  useAllowance(fromToken, fromAmount);

  const tradeOwner = useTradeOwner(
    quoteQuery.data?.outAmount,
    dexAmountOut,
    args.swapTypeIsBuy
  );
  const analyticsInit = useAnalyticsInit({
    args,
    quote: quoteQuery.data,
    tradeOwner,
  });
  const confirmSwap = useConfirmSwap({
    args,
    quote: quoteQuery.data,
    tradeOwner,
  });

  const noQuoteAmountOut = useMemo(() => {
    if (quoteQuery.isLoading) return false;
    if (quoteQuery.data?.outAmount && new BN(quoteQuery.data?.outAmount).gt(0))
      return false;
    return true;
  }, [quoteQuery.data?.outAmount, quoteQuery.isLoading]);

  return {
    quote: quoteQuery.data,
    noQuoteAmountOut,
    quoteLoading: quoteQuery.isLoading,
    quoteError: quoteQuery.error,
    confirmSwap,
    swapLoading: swapStatus === "loading",
    swapError,
    tradeOwner,
    analytics: {
      initSwap: analyticsInit,
    },
  };
};
