import { useMemo } from "react";
import { useSwapState } from "../../store";
import { amountUi } from "../utils";
import BN from "bignumber.js";

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
