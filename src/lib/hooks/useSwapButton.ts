import { useMemo } from "react";
import { useSwapState } from "../../store";
import { isNative } from "../utils";
import { useAllowance } from "./useAllowance";
import { useSwapCallback } from "./useSwap";
import { useSwapAmounts } from "./useSwapAmounts";

export const useSwapButton = () => {
  const { quote, fromToken, toToken, swapStatus } = useSwapState((store) => ({
    quote: store.quote,
    fromToken: store.fromToken,
    fromAmount: store.fromAmount,
    toToken: store.toToken,
    swapStatus: store.swapStatus,
  }));
  const { fromAmount } = useSwapAmounts();
  const { data: approved, isLoading: allowanceQueryLoading } =
    useAllowance(fromToken, fromAmount.value);
  const isPending = swapStatus === "loading" || allowanceQueryLoading;

  const swapCallback = useSwapCallback({
    fromToken,
    fromAmount: fromAmount.value,
    toToken,
    quote,
    approved,
  });

  return useMemo(() => {
    const getText = () => {
      if (isNative(fromToken?.address)) return "Wrap and swap";
      if (!approved) return "Approve and swap";
      return "Sign and Swap";
    };

    return {
      text: getText(),
      onClick: swapCallback,
      isPending,
    };
  }, [approved, fromToken, isPending, swapCallback]);
};
