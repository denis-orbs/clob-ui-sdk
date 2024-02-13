import { setWeb3Instance, signEIP712 } from "@defi.org/web3-candies";
import { useCallback } from "react";
import { useSwapState } from "../../store";
import { swapAnalytics } from "../analytics";
import { useLHContext } from "../provider";
import { STEPS } from "../types";
import { counter } from "../utils";

export const useSign = () => {
  const { account, web3 } = useLHContext();
  const updateState = useSwapState((s) => s.updateState);

  return useCallback(
    async (permitData: any) => {
      const count = counter();
      swapAnalytics.onSignatureRequest();
      updateState({ swapStatus: "loading", currentStep: STEPS.SIGN });
      try {
        if (!account || !web3) {
          throw new Error("No account or web3");
        }

        setWeb3Instance(web3);
        const signature = await signEIP712(account, permitData);
        swapAnalytics.onSignatureSuccess(signature, count());
        updateState({ swapStatus: "success" });
        return signature;
      } catch (error: any) {
        swapAnalytics.onSignatureFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [updateState, account, web3]
  );
};
