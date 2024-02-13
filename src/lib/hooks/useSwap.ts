import { zeroAddress } from "@defi.org/web3-candies";
import { useCallback } from "react";
import { useSwapState } from "../../store";
import { swapAnalytics } from "../analytics";
import { UseSwapCallback } from "../types";
import { isNative } from "../utils";
import { useAddOrder } from "./useAddOrder";
import { useApprove } from "./useApprove";
import { useRequestSwap } from "./useRequestSwap";
import { useSign } from "./useSign";
import { useWETHAddress } from "./useWethAddress";
import { useWrap } from "./useWrap";

export const useSwapCallback = ({
  fromAmount,
  fromToken,
  toToken,
  quote,
  approved,
}: UseSwapCallback) => {
  const { onSwapSuccess, onSwapError, onSwapStart, dexFallback, onCloseSwap } =
    useSwapState((store) => ({
      onSwapSuccess: store.onSwapSuccess,
      onSwapError: store.onSwapError,
      onSwapStart: store.onSwapStart,
      onSuccessDexCallback: store.onSuccessDexCallback,
      dexFallback: store.dexFallback,
      onCloseSwap: store.onCloseSwap,
    }));

  const approve = useApprove();
  const wrap = useWrap(fromToken);
  const sign = useSign();
  const requestSwap = useRequestSwap();
  const wethAddress = useWETHAddress();
  const addOrder = useAddOrder();

  return useCallback(async () => {
    try {
      if (!wethAddress) {
        throw new Error("Missing weth address");
      }

      if (!quote) {
        throw new Error("Missing quote");
      }

      if (!fromToken || !toToken) {
        throw new Error("Missing from or to token");
      }
      if (!fromAmount) {
        throw new Error("Missing from amount");
      }

      onSwapStart();
      const isNativeIn = isNative(fromToken.address);
      const isNativeOut = isNative(toToken.address);

      let inTokenAddress = isNativeIn ? zeroAddress : fromToken.address;
      const outTokenAddress = isNativeOut ? zeroAddress : toToken.address;

      if (isNativeIn) {
        await wrap(fromAmount);
        inTokenAddress = wethAddress;
      }
      if (!approved) {
        await approve(fromToken?.address, fromAmount);
      }
      swapAnalytics.onApprovedBeforeTheTrade(approved);
      const signature = await sign(quote.permitData);
      const tx = await requestSwap({
        srcToken: inTokenAddress,
        destToken: outTokenAddress,
        srcAmount: fromAmount,
        signature,
        quote,
      });
      onSwapSuccess();
      addOrder({
        id: crypto.randomUUID(),
        fromToken: fromToken,
        toToken: toToken,
        fromAmount,
      });
      return tx;
    } catch (error: any) {
      onSwapError(error.message);
      swapAnalytics.onClobFailure();
      if (dexFallback) {
        // fallback to dex

        dexFallback();
        onCloseSwap();
      }
    } finally {
      swapAnalytics.clearState();
    }
  }, [
    approve,
    wrap,
    sign,
    requestSwap,
    wethAddress,
    fromAmount,
    fromToken,
    toToken,
    quote,
    onSwapSuccess,
    onSwapError,
    approved,
    onSwapStart,
    onCloseSwap,
    dexFallback,
    addOrder,
  ]);
};
