import { useEffect, useMemo, useState } from "react";
import SwapImg from "./assets/swap.png";
import Web3 from "web3";
import { useLiquidityHubPersistedStore, useSwapState } from "./store";
import { LH_CONTROL, Step, STEPS } from "./types";
import { WETH } from "./consts";
import { isNative, useLHContext } from "./lib";
import { getLogoUrl } from "./utils";
import { partners } from "./config";

export const useQuerySettings = (location?: Location) => {
  const { setLHControl } = useLiquidityHubPersistedStore();
  const lhControl = useMemo(
    () =>
      new URLSearchParams(location?.search).get("liquidity-hub")?.toLowerCase(),
    [location?.search]
  ) as LH_CONTROL | undefined;

  useEffect(() => {
    if (!lhControl) return;
    if (lhControl === LH_CONTROL.RESET) {
      setLHControl(undefined);
      return;
    }
    setLHControl(lhControl);
  }, [lhControl, setLHControl]);
};

export const useSwapSteps = (): { [key: string]: Step } => {
  const {
    fromToken,
    wrapStatus,
    sendTxStatus,
    signStatus,
    approveStatus,
    approved,
  } = useSwapState();
  return useMemo(() => {
    const shouldWrap = isNative(fromToken?.address);
    const steps = {
      ...(shouldWrap && {
        [STEPS.WRAP]: {
          title:
            wrapStatus === "loading"
              ? "Wrap pending"
              : `Wrap ${fromToken?.symbol}`,
          image: SwapImg,
          status: wrapStatus,
        },
      }),
      ...(!approved && {
        [STEPS.APPROVE]: {
          title:
            approveStatus === "loading"
              ? "Approval pending..."
              : `Approve ${fromToken?.symbol} spending`,
          image: getLogoUrl(fromToken),
          status: approveStatus,
        },
      }),
      [STEPS.SIGN]: {
        title:
          signStatus === "loading"
            ? "Sign pending..."
            : "Sign message in wallet",
        image: SwapImg,
        status: signStatus,
        link: {
          href: "https://etherscan.io/",
          text: "Why are signatures required?",
        },
      },
      [STEPS.SEND_TX]: {
        title: sendTxStatus === "loading" ? "Swap pending..." : "Confirm swap",
        image: SwapImg,
        status: sendTxStatus,
      },
    };

    return steps;
  }, [fromToken?.address, wrapStatus, sendTxStatus, signStatus, approveStatus]);
};

export const useWeb3 = () => {
  const { provider } = useLHContext();
  return useMemo(() => {
    if (!provider) {
      return;
    }
    return new Web3(provider);
  }, [provider]);
};

export const useWETHAddress = () => {
  const { chainId } = useLHContext();

  return useMemo(() => {
    if (!chainId) return;
    return WETH[chainId];
  }, [chainId]);
};

export const usePartner = () => {
  const { partner } = useLHContext();

  return useMemo(() => {
    return partners[partner];
  }, [partner]);
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