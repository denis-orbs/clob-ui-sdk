import { zeroAddress } from "@defi.org/web3-candies";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { numericFormatter } from "react-number-format";
import { useLiquidityHubPersistedStore, useSwapState } from "../../store";
import { swapAnalytics } from "../analytics";
import { QUERY_KEYS, QUOTE_ERRORS } from "../consts";
import { useLHContext } from "../provider";
import { QuoteQueryArgs, QuoteResponse } from "../types";
import { isNative, counter, amountUi, addSlippage, shouldReturnZeroOutAmount } from "../utils";
import BN from "bignumber.js";
export const useQuote = (args: QuoteQueryArgs) => {
  const liquidityHubEnabled = useLiquidityHubPersistedStore(
    (s) => s.liquidityHubEnabled
  );
  const { fromAmount, dexAmountOut, slippage, fromToken, toToken } = args;

  const { account, chainId, partner, quoteInterval, apiUrl } = useLHContext();
  const [error, setError] = useState(false);
  const { isFailed, disableQuote } = useSwapState((s) => ({
    isFailed: s.isFailed,
    disableQuote: s.showWizard,
  }));
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
    fromAmount !== "0" &&
    !isFailed &&
    liquidityHubEnabled &&
    !args.swapTypeIsBuy &&
    !disableQuote;

  const query = useQuery({
    queryKey: [
      QUERY_KEYS.useLHQuoteQuery,
      fromAddress,
      toAddress,
      fromAmount,
      slippage,
      account,
      apiUrl,
    ],
    queryFn: async ({ signal }) => {
      swapAnalytics.onQuoteRequest();
      let result;
      const count = counter();
      try {
        const response = await fetch(`${apiUrl}/quote?chainId=${chainId}`, {
          method: "POST",
          body: JSON.stringify({
            inToken: fromAddress,
            outToken: toAddress,
            inAmount: fromAmount,
            outAmount: !dexAmountOut
              ? "-1"
              : new BN(dexAmountOut).gt(0)
              ? dexAmountOut
              : "0",
            user: account,
            slippage: slippage,
            qs: encodeURIComponent(
              window.location.hash || window.location.search
            ),
            partner: partner.toLowerCase(),
            sessionId: swapAnalytics.data.sessionId,
          }),
          signal,
        });
        result = await response.json();
        if (!result) {
          throw new Error("No result");
        }
        if (result.sessionId) {
          swapAnalytics.setSessionId(result.sessionId);
        }
        if (!result.outAmount || new BN(result.outAmount).eq(0)) {
          throw new Error(QUOTE_ERRORS.noLiquidity);
        }
        swapAnalytics.onQuoteSuccess(count(), result);

        const outAmountUI = numericFormatter(
          amountUi(toToken?.decimals, new BN(result.outAmount)),
          { decimalScale: 4, thousandSeparator: "," }
        );

        const outAmountUIWithSlippage = numericFormatter(
          amountUi(
            toToken?.decimals,
            new BN(addSlippage(result.outAmount, slippage))
          ),
          { decimalScale: 4, thousandSeparator: "," }
        );
        return {
          ...result,
          outAmountUI,
          outAmountUIWithSlippage,
        } as QuoteResponse;
      } catch (error: any) {
        swapAnalytics.onQuoteFailed(error.message, count(), result);
        if (shouldReturnZeroOutAmount(error.message)) {
          return {
            outAmount: "0",
            outAmountUI: "0",
          } as QuoteResponse;
        } else {
          throw new Error(error.message);
        }
      }
    },
    refetchInterval: quoteInterval,
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
