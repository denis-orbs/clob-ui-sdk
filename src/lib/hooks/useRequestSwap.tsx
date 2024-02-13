import { useCallback } from "react";
import { useSwapState } from "../../store";
import { swapAnalytics } from "../analytics";
import { useLHContext } from "../provider";
import { SubmitTxArgs, STEPS } from "../types";
import { counter, waitForTxReceipt } from "../utils";

export const useRequestSwap = () => {
  const { account, chainId, apiUrl, web3 } = useLHContext();
  const updateState = useSwapState((s) => s.updateState);
  return useCallback(
    async (args: SubmitTxArgs) => {
      if (!web3) {
        throw new Error("Missing web3 instance");
      }
      let txDetails;
      updateState({ swapStatus: "loading", currentStep: STEPS.SEND_TX });

      const count = counter();
      swapAnalytics.onSwapRequest();

      try {
        const txHashResponse = await fetch(
          `${apiUrl}/swapx?chainId=${chainId}`,
          {
            method: "POST",
            body: JSON.stringify({
              inToken: args.srcToken,
              outToken: args.destToken,
              inAmount: args.srcAmount,
              user: account,
              signature: args.signature,
              ...args.quote,
            }),
          }
        );
        const swap = await txHashResponse.json();
        if (!swap) {
          throw new Error("Missing swap response");
        }

        if (swap.error || (swap.message && !swap.txHash)) {
          throw new Error(swap);
        }

        if (!swap.txHash) {
          throw new Error("Missing txHash");
        }
        swapAnalytics.onSwapSuccess(swap.txHash, count());
        txDetails = await waitForTxReceipt(web3, swap.txHash);
        if (txDetails?.mined) {
          updateState({ swapStatus: "success", txHash: swap.txHash });

          swapAnalytics.onClobOnChainSwapSuccess();
          return txDetails;
        } else {
          throw new Error(txDetails?.revertMessage);
        }
      } catch (error: any) {
        const msg = error.message.error || error.message;
        swapAnalytics.onSwapFailed(msg, count(), !!txDetails?.revertMessage);
        throw new Error(msg);
      }
    },
    [web3, account, chainId, updateState]
  );
};
