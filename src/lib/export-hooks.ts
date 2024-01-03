import { useLiquidityHubPersistedStore, useSwapState } from "../store";
import { LH_CONTROL, SwapArgs } from "../types";
import { useQuote, useSwap } from "./hooks";
export * from "./hooks/useQuote";
import BN from "bignumber.js";
import { useMemo } from "react";

export const useLiquidityHubSettings = () => {
  const { liquidityHubEnabled, updateLiquidityHubEnabled } =
    useLiquidityHubPersistedStore();

  return {
    liquidityHubEnabled,
    updateLiquidityHubEnabled,
  };
};

export const useIsDexTrade = (dexOutAmount?: string, lhOutAmount?: string) => {
  const { isFailed } = useSwapState();
  const { liquidityHubEnabled, lhControl } = useLiquidityHubPersistedStore();
  return useMemo(() => {
    if (!dexOutAmount || !lhOutAmount) return;

    const isDexTrade = new BN(dexOutAmount).gt(new BN(lhOutAmount || "0"));
    if (lhControl === LH_CONTROL.SKIP || !liquidityHubEnabled) {
      return true;
    }
    if (lhControl === LH_CONTROL.FORCE) {
      console.log("LH force mode on");
      return false;
    }
    if (isFailed) {
      return true;
    }

    return isDexTrade;
  }, [dexOutAmount, lhOutAmount, lhControl, isFailed, liquidityHubEnabled]);
};

export const useLHSwap = (args: SwapArgs) => {
  const { data: quote, isLoading: quoteLoading } = useQuote({
    fromToken: args.fromToken,
    toToken: args.toToken,
    fromAmount: args.fromAmount,
    dexAmountOut: args.dexAmountOut,
  });
  const { mutate: swapCallback, isPending: swapLoading } = useSwap(args);

  return {
    quote,
    quoteLoading,
    swapCallback,
    swapLoading,
  };
};
