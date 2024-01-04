import { useEffect, useMemo, useState } from "react";
import SwapImg from "./assets/swap.png";
import Web3 from "web3";
import { useLiquidityHubPersistedStore, useSwapState } from "./store";
import { WETH } from "./consts";
import { isNative, useLHContext } from "./lib";
import { partners } from "./lib/config";
import { useNumericFormat } from "react-number-format";
import { LH_CONTROL, Step, STEPS } from "./lib/types";

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
  const { fromToken, approved, stepStatuses } = useSwapState((store) => ({
    fromToken: store.fromToken,
    approved: store.approved,
    stepStatuses: store.stepStatuses,
  }));
  return useMemo(() => {
    const shouldWrap = isNative(fromToken?.address);
    const steps = {
      ...(shouldWrap && {
        [STEPS.WRAP]: {
          loadingTitle: "Wrap pending...",
          title: `Wrap ${fromToken?.symbol}`,
          image: SwapImg,
        },
      }),
      ...(!approved && {
        [STEPS.APPROVE]: {
          loadingTitle: "Approval pending...",
          title: `Approve ${fromToken?.symbol} spending`,
          image: fromToken?.logoUrl,
        },
      }),
      [STEPS.SIGN]: {
        loadingTitle: "Sign pending...",
        title: "Sign message in wallet",
        image: SwapImg,
        link: {
          href: "https://etherscan.io/",
          text: "Why are signatures required?",
        },
      },
      [STEPS.SEND_TX]: {
        loadingTitle: "Swap pending...",
        title: "Confirm swap",
        image: SwapImg,
      },
    };

    return steps;
  }, [fromToken, stepStatuses]);
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
  const result = useNumericFormat({
    allowLeadingZeros: true,
    thousandSeparator: ",",
    displayType: "text",
    value: value || "",
    decimalScale,
    prefix,
    suffix,
  });

  return result.value?.toString();
};
