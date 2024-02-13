import { useCallback, useEffect, useMemo, useState } from "react";
import SwapImg from "../assets/swap.png";
import { useNumericFormat } from "react-number-format";
import BN from "bignumber.js";
import { WETH } from "../consts";
import { useLiquidityHubPersistedStore, useSwapState } from "../store";
import { useAllowanceQuery, useSwapCallback } from "./swap-logic";
import { Order, Step, STEPS } from "./types";
import { isNative, amountUi } from "./utils";
import { useLHContext } from "./provider";
import { chains } from "./config";

import _ from "lodash";
export const useSwapSteps = (): { steps: Step[]; isLoading: boolean } => {
  const { fromToken, fromAmount } = useSwapState((store) => ({
    fromToken: store.fromToken,
    fromAmount: store.fromAmount,
  }));

  const { isLoading: allowanceQueryLoading, data: isApproved } =
    useAllowanceQuery(fromToken, fromAmount);

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

export const useWETHAddress = () => {
  const { chainId } = useLHContext();

  return useMemo(() => {
    if (!chainId) return;
    return WETH[chainId];
  }, [chainId]);
};

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const useFormatNumber = ({
  value,
  decimalScale = 3,
  prefix,
  suffix,
}: {
  value?: string | number;
  decimalScale?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const decimals = useMemo(() => {
    if (!value) return 0;
    const [, decimal] = value.toString().split(".");
    if (!decimal) return 0;
    const arr = decimal.split("");
    let count = 0;

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === "0") {
        count++;
      } else {
        break;
      }
    }

    return !count ? decimalScale : count + decimalScale;
  }, [value, decimalScale]);

  const result = useNumericFormat({
    allowLeadingZeros: true,
    thousandSeparator: ",",
    displayType: "text",
    value: value || "",
    decimalScale: decimals,
    prefix,
    suffix,
  });

  return result.value?.toString();
};

export const useChainConfig = () => {
  const chainId = useLHContext().chainId;

  return useMemo(() => {
    if (!chainId) {
      console.error("ChainId is not set");
      return;
    }
    return chains[chainId];
  }, [chainId]);
};

export const useSwapStateExternal = () => {
  const { currentStep, txHash, error, status } = useSwapState((s) => ({
    currentStep: s.currentStep,
    txHash: s.txHash,
    error: s.swapError,
    status: s.swapStatus,
  }));

  return {
    currentStep,
    txHash,
    error,
    status,
    swapSuccess: currentStep === STEPS.SEND_TX && status === "success",
    swapFailed: !!error,
  };
};

export const useSwapAmounts = () => {
  const { fromToken, toToken, fromAmount, quote } = useSwapState((it) => ({
    fromToken: it.fromToken,
    toToken: it.toToken,
    fromAmount: it.fromAmount,
    quote: it.quote,
  }));

  return useMemo(() => {
    return {
      fromAmount: {
        value: fromAmount,
        ui: amountUi(fromToken?.decimals, new BN(fromAmount || 0)),
      },
      toAmount: {
        value: quote?.outAmount,
        ui: amountUi(toToken?.decimals, new BN(quote?.outAmount || 0)),
      },
    };
  }, [fromToken, toToken, fromAmount, quote]);
};

export const useSubmitButton = () => {
  const { quote, fromToken, toToken, swapStatus } = useSwapState((store) => ({
    quote: store.quote,
    fromToken: store.fromToken,
    fromAmount: store.fromAmount,
    toToken: store.toToken,
    swapStatus: store.swapStatus,
  }));
  const { fromAmount } = useSwapAmounts();
  const { data: approved, isLoading: allowanceQueryLoading } =
    useAllowanceQuery(fromToken, fromAmount.value);
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

export const useOrders = () => {
  const { account, chainId } = useLHContext();
  const orders = useLiquidityHubPersistedStore((s) => s.orders);
  return useMemo(() => {
    if (!account || !chainId || !orders) return;
    return orders?.[account!]?.[chainId!];
  }, [account, chainId, orders]);
};

export const useAddOrderCallback = () => {
  const addOrder = useLiquidityHubPersistedStore((s) => s.addOrder);
  const { account, chainId } = useLHContext();
  return useCallback(
    (order: Order) => {
      if (!account || !chainId) return;
      addOrder(account, chainId, order);
    },
    [addOrder, account, chainId]
  );
};

// if (!hasWeb3Instance()) {
//   setWeb3Instance(new Web3(provider as any));
// }

// const web3 = new Web3(provider as any);
// const contract = new web3.eth.Contract(
//   reactorABI as any,
//   REACTOR_ADDRESS
// );
// const latestBlock = await block();
// const targetDate = Date.parse("12 Nov 2023 00:12:00 GMT");
// const fromBlock = (await findBlock(targetDate)).number;

// let toBlock = latestBlock.number;

// const result = await getPastEvents({
//   contract,
//   eventName: "Fill",
//   filter: {
//     swapper: account!,
//   },
//   fromBlock,
//   toBlock,
//   maxDistanceBlocks: 100_000,
// });

// console.log(result);
