import {
  permit2Address,
  maxUint256,
  sendAndWaitForConfirmations,
  setWeb3Instance,
  signEIP712,
  zeroAddress,
  contract,
  erc20abi,
  isNativeAddress,
  hasWeb3Instance,
} from "@defi.org/web3-candies";
import { useQuery } from "@tanstack/react-query";
import BN from "bignumber.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import Web3 from "web3";
import {
  STEPS,
  SubmitTxArgs,
  QuoteQueryArgs,
  QuoteResponse,
  Token,
  UseLiquidityHubArgs,
  LH_CONTROL,
} from "./types";
import { useLiquidityHubAnalytics, analytics } from "../analytics";
import { QUERY_KEYS, QUOTE_ERRORS } from "../consts";
import { useLHContext } from "./provider";
import { useLiquidityHubPersistedStore, useSwapState } from "../store";
import { isNative } from "lodash";
import {
  useDebounce,
  useModifyAmounts,
  useModifyTokens,
  useWETHAddress,
} from "./hooks";
import {
  amountUi,
  counter,
  shouldReturnZeroOutAmount,
  waitForTxReceipt,
} from "./utils";
import { numericFormatter } from "react-number-format";

const useApprove = (fromTokenAddress?: string) => {
  const { account } = useLHContext();
  const getFromTokenContract = useFromTokenContractCallback();
  const { updateStepStatus } = useSwapState();
  return useCallback(
    async (srcAmount: string) => {
      const count = counter();
      analytics.onApprovalRequest();
      if (!account) {
        throw new Error("No account");
      }
      updateStepStatus(STEPS.APPROVE, "loading");
      try {
        if (!fromTokenAddress || !srcAmount) {
          throw new Error("Missing data");
        }
        const fromTokenContract = getFromTokenContract(fromTokenAddress);

        if (!fromTokenContract) {
          throw new Error("Missing contract");
        }
        const tx = fromTokenContract?.methods.approve(
          permit2Address,
          maxUint256
        );

        await sendAndWaitForConfirmations(tx, { from: account });
        analytics.onApprovalSuccess(count());
        updateStepStatus(STEPS.APPROVE, "success");
      } catch (error: any) {
        analytics.onApprovalFailed(error.message, count());
        throw new Error(error.message);
      } finally {
      }
    },
    [account, updateStepStatus, fromTokenAddress, getFromTokenContract]
  );
};

const useSign = () => {
  const { account, provider } = useLHContext();
  const { updateStepStatus } = useSwapState();

  return useCallback(
    async (permitData: any) => {
      const count = counter();
      analytics.onSignatureRequest();
      updateStepStatus(STEPS.SIGN, "loading");
      try {
        if (!account || !provider) {
          throw new Error("No account or library");
        }

        setWeb3Instance(new Web3(provider));
        const signature = await signEIP712(account, permitData);
        analytics.onSignatureSuccess(signature, count());
        updateStepStatus(STEPS.SIGN, "success");
        return signature;
      } catch (error: any) {
        analytics.onSignatureFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [updateStepStatus, account, provider]
  );
};

const useFromTokenContractCallback = () => {
  const { provider } = useLHContext();

  const wethAddress = useWETHAddress();
  return useCallback(
    (address?: string) => {
      if (!address || !provider || !hasWeb3Instance()) return undefined;
      const _address = isNativeAddress(address) ? wethAddress : address;
      return _address ? contract(erc20abi, _address) : undefined;
    },
    [provider, wethAddress]
  );
};
const useApproved = (fromToken?: Token) => {
  const { account } = useLHContext();
  const getFromTokenContract = useFromTokenContractCallback();
  return useCallback(
    async (srcAmount: string) => {
      try {
        if (!account || !fromToken || !srcAmount) {
          return false;
        }
        const fromTokenContract = getFromTokenContract(fromToken?.address);
        const allowance = await fromTokenContract?.methods
          ?.allowance(account, permit2Address)
          .call();

        return BN(allowance?.toString() || "0").gte(srcAmount);
      } catch (error) {
        console.log({ error }, "approved error");

        return false;
      }
    },
    [account, fromToken?.address, getFromTokenContract]
  );
};

const useSubmitSwap = () => {
  const { provider, account, chainId, apiUrl } = useLHContext();
  const { updateStepStatus } = useSwapState();
  return useCallback(
    async (args: SubmitTxArgs) => {
      updateStepStatus(STEPS.SEND_TX, "loading");
      const count = counter();
      analytics.onSwapRequest();

      try {
        const txHashResponse = await fetch(
          `${apiUrl}/swapx?chainId=${chainId}`,
          {
            method: "POST",
            body: JSON.stringify({
              inToken: args.srcToken,
              outToken: args.destToken,
              inAmount: args.srcAmount,
              user: account,
              signature: args.signature,
              ...args.quote,
            }),
          }
        );
        const swap = await txHashResponse.json();
        if (!swap) {
          throw new Error("Missing swap response");
        }

        if (swap.error || (swap.message && !swap.txHash)) {
          throw new Error(swap);
        }

        if (!swap.txHash) {
          throw new Error("Missing txHash");
        }
        const tx = await waitForTxReceipt(new Web3(provider), swap.txHash);
        analytics.onSwapSuccess(swap.txHash, count());
        updateStepStatus(STEPS.SEND_TX, "success", { txHash: swap.txHash });

        return tx;
      } catch (error: any) {
        const message = error.message;
        analytics.onSwapFailed(message, count());
        throw new Error(message);
      } finally {
        analytics.clearState();
      }
    },
    [provider, account, chainId, updateStepStatus]
  );
};

export const useSwap = () => {
  const {
    fromAmount,
    fromToken,
    toToken,
    quote,
    onSwapSuccess,
    onSwapError,
    onSwapStart,
  } = useSwapState((store) => ({
    fromToken: store.fromToken,
    toToken: store.toToken,
    fromAmount: store.fromAmount,
    quote: store.quote,
    onSwapSuccess: store.onSwapSuccess,
    onSwapError: store.onSwapError,
    onSwapStart: store.onSwapStart,
  }));

  const approve = useApprove(fromToken?.address);
  const wrap = useWrap(fromToken);
  const sign = useSign();
  const submitSwap = useSubmitSwap();

  const { data: approved } = useAllowanceQuery(fromToken, fromAmount);

  const wethAddress = useWETHAddress();

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
        await approve(fromAmount);
      }
      analytics.onApprovedBeforeTheTrade(approved);
      const signature = await sign(quote.permitData);
      const tx = await submitSwap({
        srcToken: inTokenAddress,
        destToken: outTokenAddress,
        srcAmount: fromAmount,
        signature,
        quote,
      });
      onSwapSuccess();

      return tx;
    } catch (error: any) {
      console.log("error", error);
      onSwapError(error.message);
      analytics.onClobFailure();
    }
  }, [
    approve,
    wrap,
    sign,
    submitSwap,
    wethAddress,
    fromAmount,
    fromToken,
    toToken,
    quote,
    onSwapSuccess,
    onSwapError,
    approved,
    onSwapStart,
  ]);
};

const useWrap = (fromToken?: Token) => {
  const { account } = useLHContext();
  const { updateStepStatus } = useSwapState();
  const getFromTokenContract = useFromTokenContractCallback();

  return useCallback(
    async (srcAmount: string) => {
      const count = counter();
      analytics.onWrapRequest();

      if (!account) {
        throw new Error("Missing account");
      }
      if (!fromToken) {
        throw new Error("Missing from token");
      }
      const fromTokenContract = getFromTokenContract(fromToken?.address);
      if (!fromTokenContract) {
        throw new Error("Missing from token contract");
      }
      updateStepStatus(STEPS.WRAP, "loading");
      try {
        if (!fromToken || !srcAmount) return;
        const tx = fromTokenContract?.methods?.deposit();
        await sendAndWaitForConfirmations(tx, {
          from: account,
          value: srcAmount,
        });

        // setFromAddress(WBNB_ADDRESS);
        analytics.onWrapSuccess(count());
        updateStepStatus(STEPS.WRAP, "success");
        return true;
      } catch (error: any) {
        analytics.onWrapFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [account, updateStepStatus, getFromTokenContract]
  );
};

export const useAllowanceQuery = (fromToken?: Token, fromAmount?: string) => {
  const debouncedFromAmount = useDebounce(fromAmount, 400);
  const isApproved = useApproved(fromToken);
  const { provider } = useLHContext();
  const { account, chainId } = useLHContext();
  return useQuery({
    queryKey: [
      QUERY_KEYS.useApprovedQuery,
      account,
      chainId,
      fromToken?.address,
      fromAmount,
    ],
    queryFn: async () => {
      if (!fromToken || !debouncedFromAmount) return false;
      const approved = await isApproved(debouncedFromAmount);
      return approved;
    },
    enabled:
      !!provider &&
      !!fromToken &&
      !!account &&
      !!chainId &&
      !!debouncedFromAmount,
    staleTime: Infinity,
  });
};

export const useQuote = ({
  fromToken,
  toToken,
  fromAmount,
  dexAmountOut,
  slippage,
}: QuoteQueryArgs) => {
  const liquidityHubEnabled = useLiquidityHubPersistedStore(
    (s) => s.liquidityHubEnabled
  );
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
    !isFailed &&
    liquidityHubEnabled &&
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
      analytics.onQuoteRequest();
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
            sessionId: analytics.data.sessionId,
          }),
          signal,
        });
        result = await response.json();
        if (!result) {
          throw new Error("No result");
        }
        if (result.sessionId) {
          analytics.setSessionId(result.sessionId);
        }
        if (!result.outAmount || new BN(result.outAmount).eq(0)) {
          throw new Error(QUOTE_ERRORS.noLiquidity);
        }
        analytics.onQuoteSuccess(count(), result);
        return {
          ...result,
          outAmountUI: numericFormatter(
            amountUi(toToken?.decimals, new BN(result.outAmount)),
            { decimalScale: 4, thousandSeparator: "," }
          ),
        } as QuoteResponse;
      } catch (error: any) {
        analytics.onQuoteFailed(error.message, count(), result);
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

export const useSettings = () => {
  const { liquidityHubEnabled, updateLiquidityHubEnabled } =
    useLiquidityHubPersistedStore();

  return {
    liquidityHubEnabled,
    updateLiquidityHubEnabled,
  };
};

export const useTradeOwner = (
  lhOutAmount?: string,
  dexOutAmount?: string
): "dex" | "lh" | undefined => {
  const isFailed = useSwapState((s) => s.isFailed);
  const { liquidityHubEnabled, lhControl } = useLiquidityHubPersistedStore();
  return useMemo(() => {
    if (new BN(dexOutAmount || "0").lte(0) && new BN(lhOutAmount || "0").lte(0))
      return;

    if (lhControl === LH_CONTROL.SKIP || !liquidityHubEnabled) {
      return "dex";
    }
    if (lhControl === LH_CONTROL.FORCE) {
      console.log("LH force mode on");
      return "lh";
    }
    if (isFailed) {
      return "dex";
    }

    return new BN(lhOutAmount || "0").gt(new BN(dexOutAmount || "0"))
      ? "lh"
      : "dex";
  }, [dexOutAmount, lhOutAmount, lhControl, isFailed, liquidityHubEnabled]);
};

export const useLiquidityHub = (args: UseLiquidityHubArgs) => {
  const { fromToken, toToken } = useModifyTokens(args.fromToken, args.toToken);
  const { fromAmount, dexAmountOut } = useModifyAmounts(
    fromToken,
    toToken,
    args.fromAmount,
    args.fromAmountUI,
    args.dexAmountOut,
    args.dexAmountOutUI
  );
  useAllowanceQuery(fromToken, fromAmount);

  const { slippage, fromTokenUsd, toTokenUsd } = args;
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
    slippage,
  });

  const tradeOwner = useTradeOwner(quote?.outAmount, dexAmountOut);
  const analytics = useLiquidityHubAnalytics();
  const analyticsInitSwap = () => {
    return useCallback(() => {
      if (!fromToken || !toToken || !fromAmount) return;
      analytics.initSwap({
        fromToken,
        toToken,
        dexAmountOut,
        dstTokenUsdValue: toTokenUsd,
        srcAmountUI: amountUi(fromToken.decimals, new BN(fromAmount)),
        quoteOutAmount: quote?.outAmount,
        slippage,
      });
    }, [
      fromToken,
      toToken,
      dexAmountOut,
      toTokenUsd,
      fromAmount,
      quote,
      slippage,
      analytics.initSwap,
    ]);
  };
  const confirmSwap = useCallback(
    async (onSwapSuccess?: () => void) => {
      if (!fromToken) {
        console.error("from token missing");
        return;
      }
      if (!toToken) {
        console.error("to token missing");
        return;
      }

      if (!fromAmount) {
        console.error("from amount missing");
        return;
      }
      updateState({
        fromToken,
        toToken,
        fromAmount,
        fromTokenUsd,
        toTokenUsd,
        quote,
        showWizard: true,
        onSwapSuccessCallback: onSwapSuccess,
      });
    },
    [
      fromToken,
      toToken,
      fromAmount,
      fromTokenUsd,
      toTokenUsd,
      quote,
      tradeOwner,
      updateState,
      dexAmountOut,
      analyticsInitSwap,
    ]
  );

  return {
    quote,
    quoteLoading,
    quoteError,
    confirmSwap,
    swapLoading: swapStatus === "loading",
    swapError,
    tradeOwner,
    analytics: {
      initSwap: analyticsInitSwap,
    },
  };
};
