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
  const initSwap = useSwapState((store) => store.initSwap);
  const partner = usePartner();
  const { fromToken, toToken } = useMemo(() => {
    if (!partner || !partner.normalizeToken) {
      return {
        fromToken: args.fromToken,
        toToken: args.toToken,
      };
    }
    return {
      fromToken: partner.normalizeToken(args.fromToken),
      toToken: partner.normalizeToken(args.toToken),
    };
  }, [partner, args.fromToken, args.toToken]);

  // poll for allowance
  useAllowanceQuery(fromToken, args.fromAmount);
  const queryKey = useApproveQueryKey(fromToken?.address, args.fromAmount);
  const queryClient = useQueryClient();

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

  const {
    mutate: swapCallback,
    isPending: swapLoading,
    error: swapError,
  } = useMutation({
    mutationFn: async () => {
      if (!args.fromToken || !args.toToken || !args.fromAmount || !quote) {
        return;
      }
      return queryClient.ensureQueryData({ queryKey }) as Promise<boolean>;
    },
    onSuccess: (approved) => {
      initSwap({
        fromToken,
        toToken,
        fromAmount: args.fromAmount,
        fromTokenUsd: args.fromTokenUsd,
        toTokenUsd: args.toTokenUsd,
        quote,
        approved,
      });
    },
  });

  return {
    quote,
    quoteLoading,
    quoteError,
    swapCallback,
    swapLoading,
    swapError,
    isLiquidityHubTrade,
  };
};
