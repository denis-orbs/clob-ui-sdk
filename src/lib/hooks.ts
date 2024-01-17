import { useEffect, useMemo, useState } from "react";
import SwapImg from "../assets/swap.png";
import Web3 from "web3";

import { useNumericFormat } from "react-number-format";

import BN from "bignumber.js";
import { WETH } from "../consts";
import { useSwapState } from "../store";
import { partners } from "./config";
import { useAllowanceQuery } from "./swap-logic";
import { DappToken, Step, STEPS, Token } from "./types";
import { isNative, amountUi, amountBN } from "./utils";
import { useLHContext } from "./provider";
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

export const useModifyTokens = (fromToken?: DappToken, toToken?: DappToken) => {
  const partner = usePartner();

  return useMemo(() => {
    if (!partner || !partner.normalizeToken) {
      return {
        fromToken: undefined,
        toToken: undefined,
      };
    }
    return {
      fromToken: fromToken && partner.normalizeToken(fromToken),
      toToken: toToken && partner.normalizeToken(toToken),
    };
  }, [partner, fromToken?.address, toToken?.address]);
};

export const useModifyAmounts = (
  fromToken?: Token,
  toToken?: Token,
  fromAmount?: string,
  fromAmountUI?: string,
  dexAmountOut?: string,
  dexAmountOutUI?: string
) => {
  const _fromAmount = useMemo(() => {
    if (!fromAmount && !fromAmountUI) return undefined;
    if (fromAmount) return fromAmount;
    return fromToken ?  amountBN(fromToken, fromAmountUI || "0").toString() : undefined;
  }, [fromAmount, fromAmountUI, fromToken]);

  const _dexAmountOut = useMemo(() => {
    if (!dexAmountOut && !dexAmountOutUI) return undefined;
    if (dexAmountOut) return dexAmountOut;
      return toToken ?  amountBN(toToken, dexAmountOutUI || "0").toString() : undefined;
  }, [dexAmountOut, dexAmountOutUI, toToken]);

  return {
    fromAmount: _fromAmount,
    dexAmountOut: _dexAmountOut,
  };
};
