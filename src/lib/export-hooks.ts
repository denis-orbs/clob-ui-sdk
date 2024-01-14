import { useLiquidityHubPersistedStore, useSwapState } from "../store";
import {
  useAllowanceQuery,
  useApproveQueryKey,
  useIsLiquidityHubTrade,
  useQuote,
} from "./hooks";
import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UseLiquidityHubArgs } from "./types";
import { usePartner } from "../hooks";
import { useLiquidityHubAnalytics } from "../analytics";
import { useSwapWizard } from "../swap-wizard/useSwapWizard";

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

  const isLiquidityHubTrade = useIsLiquidityHubTrade(
    quote?.outAmount,
    args.dexAmountOut
  );
    useSwapWizard();
  const swapCallback = useCallback(
    async ({ dexSwap }: { dexSwap?: () => void }) => {
      try {
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
        if (!isLiquidityHubTrade) {
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
        // get allowance from cache, or wait for it to be fetched
        const approved = await queryClient.ensureQueryData({
          queryKey,
        });

        updateState({
          approved: approved as boolean,
        });
      } catch (error) {}
    },
    [
      fromToken,
      toToken,
      args.fromAmount,
      args.fromTokenUsd,
      args.toTokenUsd,
      quote,
      isLiquidityHubTrade,
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
    isLiquidityHubTrade,
  };
};
