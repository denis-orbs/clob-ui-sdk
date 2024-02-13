import { useMemo } from "react";
import { useSwapState } from "../../store";
import { Step, STEPS } from "../types";
import { isNative } from "../utils";
import { useAllowance } from "./useAllowance";
import SwapImg from "../assets/swap.png";

export const useSteps = (): { steps: Step[]; isLoading: boolean } => {
  const { fromToken, fromAmount } = useSwapState((store) => ({
    fromToken: store.fromToken,
    fromAmount: store.fromAmount,
  }));

  const { isLoading: allowanceQueryLoading, data: isApproved } = useAllowance(
    fromToken,
    fromAmount
  );

  return useMemo(() => {
    if (allowanceQueryLoading) {
      return {
        steps: [],
        isLoading: true,
      };
    }
    const shouldWrap = isNative(fromToken?.address);
    const wrap: Step = {
      loadingTitle: "Wrap pending...",
      title: `Wrap ${fromToken?.symbol}`,
      image: SwapImg,
      id: STEPS.WRAP,
    };

    const approve: Step = {
      loadingTitle: "Approval pending...",
      title: `Approve ${fromToken?.symbol} spending`,
      image: fromToken?.logoUrl,
      id: STEPS.APPROVE,
    };

    const sign: Step = {
      loadingTitle: "Sign pending...",
      title: "Sign message in wallet",
      image: SwapImg,
      id: STEPS.SIGN,
      link: {
        href: "https://etherscan.io/",
        text: "Why are signatures required?",
      },
    };

    const sendTx: Step = {
      id: STEPS.SEND_TX,
      loadingTitle: "Swap pending...",
      title: "Confirm swap",
      image: SwapImg,
    };

    const steps = [sign, sendTx];

    if (!isApproved) {
      steps.unshift(approve);
    }

    if (shouldWrap) {
      steps.unshift(wrap);
    }
    return { steps, isLoading: false };
  }, [fromToken, isApproved, allowanceQueryLoading]);
};
