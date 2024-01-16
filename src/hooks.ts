import { useEffect, useMemo, useState } from "react";
import SwapImg from "./assets/swap.png";
import Web3 from "web3";
import { useSwapState } from "./store";
import { WETH } from "./consts";
import { amountUi, isNative, useLHContext } from "./lib";
import { partners } from "./lib/config";
import { useNumericFormat } from "react-number-format";
import { Step, STEPS } from "./lib/types";
import { useAllowanceQuery } from "./lib/hooks";
import BN from "bignumber.js";
export const useSwapSteps = (): { [key: string]: Step } | undefined => {
  const { fromToken, stepStatuses, fromAmount } = useSwapState((store) => ({
    fromToken: store.fromToken,
    stepStatuses: store.stepStatuses,
    fromAmount: store.fromAmount,
  }));

  const { data: approved, isLoading: aprovedLoading } = useAllowanceQuery(
    fromToken,
    fromAmount
  );

  console.log({ approved });

  return useMemo(() => {
    if (aprovedLoading) {
      return undefined;
    }
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
  }, [fromToken, stepStatuses, approved, aprovedLoading]);
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

export const useFromAmountUI = () => {
  const { fromAmount, fromToken } = useSwapState((store) => ({
    fromAmount: store.fromAmount,
    fromToken: store.fromToken,
  }));

  const amount = useMemo(() => {
    if (!fromAmount) return "";
    return amountUi(fromToken?.decimals, new BN(fromAmount));
  }, [fromAmount, fromToken]);

  return useFormatNumber({
    value: amount,
  });
};


export const useToAmountUI = () => {
  const { toToken, quote } = useSwapState((store) => ({
    quote: store.quote,
    toToken: store.toToken,
  }));

  const amount = useMemo(() => {
    if (!quote) return "";
    return amountUi(toToken?.decimals, new BN(quote.outAmount));
  }, [quote, toToken]);

  return useFormatNumber({
    value: amount,
  });
};
