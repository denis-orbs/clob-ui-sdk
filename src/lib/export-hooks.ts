import { useLiquidityHubPersistedStore, useSwapState } from "../store";
import {
  useAllowanceQuery,
  useApproveQueryKey,
  useTradeOwner,
  useQuote,
} from "./hooks";
import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UseLiquidityHubArgs } from "./types";
import { usePartner } from "../hooks";
import { useLiquidityHubAnalytics } from "../analytics";

export const useSettings = () => {
  const { liquidityHubEnabled, updateLiquidityHubEnabled } =
    useLiquidityHubPersistedStore();

  return {
    liquidityHubEnabled,
    updateLiquidityHubEnabled,
  };
};

export const useLiquidityHub = (args: UseLiquidityHubArgs) => {
  const partner = usePartner();
  const analytics = useLiquidityHubAnalytics();
  const { fromToken, toToken } = useMemo(() => {
    if (!partner || !partner.normalizeToken) {
      return {
        fromToken: args.fromToken,
        toToken: args.toToken,
      };
    }
    return {
      fromToken: args.fromToken && partner.normalizeToken(args.fromToken),
      toToken: args.toToken && partner.normalizeToken(args.toToken),
    };
  }, [partner, args.fromToken?.address, args.toToken?.address]);

  // poll for allowance
  useAllowanceQuery(fromToken, args.fromAmount);
  const queryKey = useApproveQueryKey(fromToken?.address, args.fromAmount);
  const queryClient = useQueryClient();
  const { swapStatus, swapError, updateState } = useSwapState((store) => ({
    swapStatus: store.swapStatus,
    swapError: store.swapError,
    updateState: store.updateState,
  }));

  const {
    data: quote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useQuote({
    fromToken,
    toToken,
    fromAmount: args.fromAmount,
    dexAmountOut: args.dexAmountOut,
  });

  const tradeOwner = useTradeOwner(
    quote?.outAmount,
    args.dexAmountOut
  );
  
  const swapCallback = useCallback(
    async (dexSwap?: () => void) => {
      if (!fromToken || !toToken || !args.fromAmount) {
        return;
      }
      analytics.initSwap({
        srcToken: fromToken,
        dstToken: toToken,
        dexAmountOut: args.dexAmountOut,
        dstTokenUsdValue: args.toTokenUsd,
        srcAmount: args.fromAmount,
        quoteOutAmount: quote?.outAmount,
      });
      if (tradeOwner === "dex") {
        dexSwap?.();
        return;
      }
      updateState({
        fromToken,
        toToken,
        fromAmount: args.fromAmount,
        fromTokenUsd: args.fromTokenUsd,
        toTokenUsd: args.toTokenUsd,
        quote,
        showWizard: true,
        dexOnSwapSuccess: args.onSwapSuccess,
      });
    },
    [
      fromToken,
      toToken,
      args.fromAmount,
      args.fromTokenUsd,
      args.toTokenUsd,
      quote,
      tradeOwner,
      queryClient,
      queryKey,
      updateState,
      args.onSwapSuccess,
      args.dexAmountOut,
    ]
  );

  return {
    quote,
    quoteLoading,
    quoteError,
    swapCallback,
    swapLoading: swapStatus === "loading",
    swapError,
    tradeOwner,
    outAmount: tradeOwner === "lh" ? quote?.outAmount : tradeOwner === 'dex' ? args.dexAmountOut : undefined,
  };
};
