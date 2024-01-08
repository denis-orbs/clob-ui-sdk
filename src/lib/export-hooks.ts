import { useLiquidityHubPersistedStore, useSwapState } from "../store";
import {
  useAllowanceQuery,
  useApproveQueryKey,
  useIsClobTrade,
  useQuote,
} from "./hooks";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SwapArgs } from "./types";
import { usePartner } from "../hooks";

export const useSettings = () => {
  const { liquidityHubEnabled, updateLiquidityHubEnabled } =
    useLiquidityHubPersistedStore();

  return {
    liquidityHubEnabled,
    updateLiquidityHubEnabled,
  };
};

export const useLHSwap = (args: SwapArgs) => {
  const partner = usePartner();
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
  const isLiquidityHubTrade = useIsClobTrade(
    args.dexAmountOut,
    quote?.outAmount
  );

  const { mutate} = useMutation({
    mutationFn: async () => {        
      if (!args.fromToken || !args.toToken || !args.fromAmount) {
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
          dexOnSwapSuccess: args.onSwapSuccess
        });
      return queryClient.ensureQueryData({ queryKey }) as Promise<boolean>;
    },
    onSuccess: (approved) => {
      updateState({
        approved,
      });
    },
  });

  return {
    quote,
    quoteLoading,
    quoteError,
    swapCallback: mutate,
    swapLoading: swapStatus === "loading",
    swapError,
    isLiquidityHubTrade,
  };
};
