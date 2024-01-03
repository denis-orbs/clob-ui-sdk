import { zeroAddress } from "@defi.org/web3-candies";
import { useEffect, useMemo, useState } from "react";
import {
  API_ENDPOINT,
  DEFAULT_QUOTE_INTERVAL,
  QUERY_KEYS,
  QUOTE_ERRORS,
} from "../../consts";
import { useLHContext } from "../providers";
import { useLiquidityHubPersistedStore, useSwapState } from "../../store";
import {
  QuoteArgs,
  QuoteQueryArgs,
  QuoteResponse,
} from "../../types";
import BN from "bignumber.js";
import { useQuery } from "@tanstack/react-query";
import { isNative } from "lodash";
import { shouldReturnZeroOutAmount } from "../../utils";
import { amountBN } from "../utils";
const quote = async (args: QuoteArgs) => {
  try {
    const response = await fetch(
      `${API_ENDPOINT}/quote?chainId=${args.chainId}`,
      {
        method: "POST",
        body: JSON.stringify({
          inToken: isNative(args.inToken) ? zeroAddress : args.inToken,
          outToken: isNative(args.outToken) ? zeroAddress : args.outToken,
          inAmount: args.inAmount,
          outAmount: !args.dexAmountOut
            ? "-1"
            : new BN(args.dexAmountOut).gt(0)
            ? args.dexAmountOut
            : "0",
          user: args.account,
          slippage: args.slippage,
          qs: encodeURIComponent(window.location.hash),
          partner: args.partner.toLowerCase(),
        }),
        signal: args.signal,
      }
    );
    const result = await response.json();
    if (!result) {
      throw new Error("No result");
    }

    if (!result.outAmount || new BN(result.outAmount).eq(0)) {
      throw new Error(QUOTE_ERRORS.noLiquidity);
    }

    return result as QuoteResponse;
  } catch (error: any) {
    console.log("quote error", error);

    if (shouldReturnZeroOutAmount(error.message)) {
      return {
        outAmount: "0",
      } as QuoteResponse;
    } else {
      throw new Error(error.message);
    }
  }
};

export const useQuote = ({
  fromToken,
  toToken,
  fromAmount,
  dexAmountOut,
}: QuoteQueryArgs) => {
  const { liquidityHubEnabled } = useLiquidityHubPersistedStore();
  const { account, slippage, chainId, partner, settings } = useLHContext();
  const [error, setError] = useState(false);
  const isFailed = useSwapState((s) => s.isFailed);

  const { fromAddress, toAddress } = useMemo(() => {
    return {
      fromAddress: isNative(fromToken?.address)
        ? zeroAddress
        : fromToken?.address,
      toAddress: isNative(toToken?.address) ? zeroAddress : toToken?.address,
    };
  }, [fromToken?.address, toToken?.address]);

  const enabled =
    !!partner &&
    !!chainId &&
    !!account &&
    !!fromToken &&
    !!toToken &&
    !!fromAmount &&
    !isFailed &&
    liquidityHubEnabled;

  const query = useQuery({
    queryKey: [
      QUERY_KEYS.useLHQuoteQuery,
      fromAddress,
      toAddress,
      fromAmount,
      slippage,
      account,
    ],
    queryFn: async ({ signal }) => {
      const res = await quote({
        inToken: fromAddress!,
        outToken: toAddress!,
        inAmount: amountBN(fromToken!, fromAmount!).toString(),
        dexAmountOut,
        slippage,
        account,
        signal,
        chainId: chainId!,
        partner,
      });
      return res;
    },
    refetchInterval: false
      ? undefined
      : settings?.quoteInterval || DEFAULT_QUOTE_INTERVAL,
    enabled,
    gcTime: 0,
    retry: 2,
  });

  useEffect(() => {
    if (query.isError) {
      setError(true);
    }
  }, [query.isError]);

  useEffect(() => {
    return () => {
      setError(false);
    };
  }, [fromAddress, toAddress, fromAmount, slippage, account]);

  return { ...query, isLoading: error ? false : query.isLoading };
};
