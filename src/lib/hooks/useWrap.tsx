import { sendAndWaitForConfirmations } from "@defi.org/web3-candies";
import { useCallback } from "react";
import { Token } from "..";
import { useSwapState } from "../../store";
import { swapAnalytics } from "../analytics";
import { useLHContext } from "../provider";
import { STEPS } from "../types";
import { counter } from "../utils";
import { useChainConfig } from "./useChainConfig";
import { useFromTokenContractCallback } from "./useFromTokenContractCallback";

export const useWrap = (fromToken?: Token) => {
  const { account } = useLHContext();
  const { updateState, setFromAddress } = useSwapState((s) => ({
    updateState: s.updateState,
    setFromAddress: s.setFromAddress,
  }));
  const getFromTokenContract = useFromTokenContractCallback();
  const wTokenAddress = useChainConfig()?.wTokenAddress;
  return useCallback(
    async (srcAmount: string) => {
      const count = counter();
      swapAnalytics.onWrapRequest();

      if (!account) {
        throw new Error("Missing account");
      }
      if (!fromToken) {
        throw new Error("Missing from token");
      }
      const fromTokenContract = getFromTokenContract(fromToken?.address);
      if (!fromTokenContract) {
        throw new Error("Missing from token contract");
      }
      updateState({ swapStatus: "loading", currentStep: STEPS.WRAP });
      try {
        if (!fromToken || !srcAmount) return;
        const tx = fromTokenContract?.methods?.deposit();
        await sendAndWaitForConfirmations(tx, {
          from: account,
          value: srcAmount,
        });

        wTokenAddress && setFromAddress?.(wTokenAddress);
        swapAnalytics.onWrapSuccess(count());
        updateState({ swapStatus: "success" });

        return true;
      } catch (error: any) {
        swapAnalytics.onWrapFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [
      account,
      updateState,
      getFromTokenContract,
      fromToken,
      setFromAddress,
      wTokenAddress,
    ]
  );
};
