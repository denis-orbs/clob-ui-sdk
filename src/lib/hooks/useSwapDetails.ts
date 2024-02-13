import { useSwapState } from "../../store";
import { useSwapAmounts } from "./useSwapAmounts";

export const useSwapDetails = () => {
  const store = useSwapState();
  const { fromAmount, toAmount } = useSwapAmounts();

  return {
    currentStep: store.currentStep,
    fromToken: store.fromToken,
    toToken: store.toToken,
    fromAmount: fromAmount.value,
    fromAmountUI: fromAmount.ui,
    fromTokenUsd: store.fromTokenUsd,
    toTokenUsd: store.toTokenUsd,
    txHash: store.txHash,
    swapStatus: store.swapStatus,
    swapError: store.swapError,
    toAmount: toAmount.value,
    toAmountUI: toAmount.ui,
    showSubmitModal: store.showWizard,
  };
};
