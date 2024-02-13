import { permit2Address, maxUint256, sendAndWaitForConfirmations } from "@defi.org/web3-candies";
import { useCallback } from "react";
import { useSwapState } from "../../store";
import { swapAnalytics } from "../analytics";
import { useLHContext } from "../provider";
import { STEPS } from "../types";
import { counter } from "../utils";
import { useFromTokenContractCallback } from "./useFromTokenContractCallback";

export const useApprove = () => {
  const { account } = useLHContext();
  const getFromTokenContract = useFromTokenContractCallback();
  const updateState = useSwapState((s) => s.updateState);
  return useCallback(
    async (fromTokenAddress?: string, srcAmount?: string) => {
      const count = counter();
      swapAnalytics.onApprovalRequest();
      if (!account) {
        throw new Error("No account");
      }
      updateState({ swapStatus: "loading", currentStep: STEPS.APPROVE });
      try {
        if (!fromTokenAddress || !srcAmount) {
          throw new Error("Missing data");
        }
        const fromTokenContract = getFromTokenContract(fromTokenAddress);

        if (!fromTokenContract) {
          throw new Error("Missing contract");
        }
        const tx = fromTokenContract?.methods.approve(
          permit2Address,
          maxUint256
        );

        await sendAndWaitForConfirmations(tx, { from: account });
        swapAnalytics.onApprovalSuccess(count());
        updateState({ swapStatus: "success" });
      } catch (error: any) {
        swapAnalytics.onApprovalFailed(error.message, count());
        throw new Error(error.message);
      } finally {
      }
    },
    [account, updateState, getFromTokenContract]
  );
};
