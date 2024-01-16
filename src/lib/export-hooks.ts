import { useLiquidityHubPersistedStore, useSwapState } from "../store";
import { useAllowanceQuery, useTradeOwner, useQuote } from "./hooks";
import { useCallback, useMemo } from "react";
import { UseLiquidityHubArgs } from "./types";
import { usePartner } from "../hooks";
import { useLiquidityHubAnalytics } from "../analytics";
import BN from "bignumber.js";
import { amountBN, amountUi } from "./utils";
export const useSettings = () => {
  const { liquidityHubEnabled, updateLiquidityHubEnabled } =
    useLiquidityHubPersistedStore();

  return {
    liquidityHubEnabled,
    updateLiquidityHubEnabled,
  };
};

export const useLiquidityHub = (args: UseLiquidityHubArgs) => {
  const partner = usePartner();
  const analytics = useLiquidityHubAnalytics();

  // parse tokens
  const { fromToken, toToken } = useMemo(() => {
    if (!partner || !partner.normalizeToken) {
      return {
        fromToken: args.fromToken,
        toToken: args.toToken,
      };
    }
    return {
      fromToken: args.fromToken && partner.normalizeToken(args.fromToken),
      toToken: args.toToken && partner.normalizeToken(args.toToken),
    };
  }, [partner, args.fromToken?.address, args.toToken?.address]);

  // handling amounts formats from dex (wei or ui amount)
  const fromAmount = useMemo(() => {
    if (!args.fromAmount && !args.fromAmountUI) {
      return undefined;
    }

    return args.fromAmount
      ? args.fromAmount
      : amountBN(fromToken, args.fromAmountUI || "0").toString();
  }, [args.fromAmount, args.fromAmountUI, fromToken]);

  const dexAmountOut = useMemo(() => {
    if (!args.dexAmountOut && !args.dexAmountOutUI) {
      return undefined;
    }
    return args.dexAmountOut
      ? args.dexAmountOut
      : amountBN(toToken, args.dexAmountOutUI || "0").toString();
  }, [args.dexAmountOut, args.dexAmountOutUI, toToken]);

  // poll for allowance
  useAllowanceQuery(fromToken, fromAmount);
  const { swapStatus, swapError, updateState } = useSwapState((store) => ({
    swapStatus: store.swapStatus,
    swapError: store.swapError,
    updateState: store.updateState,
  }));

  const {
    data: quote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useQuote({
    fromToken,
    toToken,
    fromAmount,
    dexAmountOut,
    slippage: args.slippage,
  });

  const tradeOwner = useTradeOwner(quote?.outAmount, dexAmountOut);

  const swapCallback = useCallback(
    async ({
      dexSwap,
      onSwapSuccess,
    }: {
      dexSwap: () => void;
      onSwapSuccess?: () => void;
    }) => {
      if (!fromToken || !toToken || !fromAmount) {
        return;
      }
      analytics.initSwap({
        fromToken,
        toToken,
        dexAmountOut,
        dstTokenUsdValue: args.toTokenUsd,
        srcAmountUI: amountUi(fromToken, new BN(fromAmount)),
        quoteOutAmount: quote?.outAmount,
        slippage: args.slippage,
      });
      if (tradeOwner === "dex") {
        dexSwap();
        return;
      }
      updateState({
        fromToken,
        toToken,
        fromAmount,
        fromTokenUsd: args.fromTokenUsd,
        toTokenUsd: args.toTokenUsd,
        quote,
        showWizard: true,
        onSwapSuccessCallback: onSwapSuccess,
      });
    },
    [
      fromToken,
      toToken,
      fromAmount,
      args.fromTokenUsd,
      args.toTokenUsd,
      quote,
      tradeOwner,
      updateState,
      dexAmountOut,
    ]
  );

  return {
    quote,
    quoteLoading,
    quoteError,
    swapCallback,
    swapLoading: swapStatus === "loading",
    swapError,
    tradeOwner,
    outAmount:
      tradeOwner === "lh"
        ? quote?.outAmount
        : tradeOwner === "dex"
        ? args.dexAmountOut
        : undefined,
  };
};
