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
  SubmitTxArgs,
  QuoteQueryArgs,
  QuoteResponse,
  Token,
  UseLiquidityHubArgs,
  LH_CONTROL,
  SubmitSwapArgs,
  STEPS,
} from "./types";
import { QUERY_KEYS, QUOTE_ERRORS } from "../consts";
import { useLHContext } from "./provider";
import { useLiquidityHubPersistedStore, useSwapState } from "../store";
import { isNative } from "lodash";
import {
  useDebounce,
  useModifyAmounts,
  useWETHAddress,
} from "./hooks";
import {
  addSlippage,
  amountUi,
  counter,
  shouldReturnZeroOutAmount,
  waitForTxReceipt,
} from "./utils";
import { numericFormatter } from "react-number-format";
import { Analytics } from "./analytics";

export const analytics = new Analytics();

const useApprove = (fromTokenAddress?: string) => {
  const { account } = useLHContext();
  const getFromTokenContract = useFromTokenContractCallback();
  const { updateState } = useSwapState();
  return useCallback(
    async (srcAmount: string) => {
      const count = counter();
      analytics.onApprovalRequest();
      if (!account) {
        throw new Error("No account");
      }
      updateState({ swapStatus: "loading", currentStep: STEPS.APPROVE });
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
        updateState({ swapStatus: "success" });
      } catch (error: any) {
        analytics.onApprovalFailed(error.message, count());
        throw new Error(error.message);
      } finally {
      }
    },
    [account, updateState, fromTokenAddress, getFromTokenContract]
  );
};

const useSign = () => {
  const { account, provider } = useLHContext();
  const { updateState } = useSwapState();

  return useCallback(
    async (permitData: any) => {
      const count = counter();
      analytics.onSignatureRequest();
      updateState({ swapStatus: "loading", currentStep: STEPS.SIGN });
      try {
        if (!account || !provider) {
          throw new Error("No account or library");
        }

        setWeb3Instance(new Web3(provider));
        const signature = await signEIP712(account, permitData);
        analytics.onSignatureSuccess(signature, count());
        updateState({ swapStatus: "success" });
        return signature;
      } catch (error: any) {
        analytics.onSignatureFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [updateState, account, provider]
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
  const { updateState } = useSwapState();
  return useCallback(
    async (args: SubmitTxArgs) => {
      let txDetails;
      updateState({ swapStatus: "loading", currentStep: STEPS.SEND_TX });

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
        analytics.onSwapSuccess(swap.txHash, count());
        txDetails = await waitForTxReceipt(new Web3(provider), swap.txHash);
        if (txDetails?.mined) {
          updateState({ swapStatus: "success", txHash: swap.txHash });

          analytics.onClobOnChainSwapSuccess();
        } else {
          throw new Error(txDetails?.revertMessage);
        }
      } catch (error: any) {
        const msg = error.message.error || error.message;
        analytics.onSwapFailed(msg, count(), !!txDetails?.revertMessage);
        throw new Error(msg);
      }
    },
    [provider, account, chainId, updateState]
  );
};

export const useSwap = ({
  fromAmount,
  fromToken,
  toToken,
  quote,
}: SubmitSwapArgs) => {
  const {
    onSwapSuccess: onStoreSwapSuccess,
    onSwapError,
    onSwapStart,
  } = useSwapState((store) => ({
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

  return useCallback(
    async (onSwapSuccessDexCallback?: () => void) => {
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
        onStoreSwapSuccess();
        onSwapSuccessDexCallback?.();
        return tx;
      } catch (error: any) {
        onSwapError(error.message);
        analytics.onClobFailure();
      } finally {
        analytics.clearState();
      }
    },
    [
      approve,
      wrap,
      sign,
      submitSwap,
      wethAddress,
      fromAmount,
      fromToken,
      toToken,
      quote,
      onStoreSwapSuccess,
      onSwapError,
      approved,
      onSwapStart,
    ]
  );
};

const useWrap = (fromToken?: Token) => {
  const { account } = useLHContext();
  const { updateState } = useSwapState();
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
      updateState({ swapStatus: "loading", currentStep: STEPS.WRAP });
      try {
        if (!fromToken || !srcAmount) return;
        const tx = fromTokenContract?.methods?.deposit();
        await sendAndWaitForConfirmations(tx, {
          from: account,
          value: srcAmount,
        });

        // setFromAddress(WBNB_ADDRESS);
        analytics.onWrapSuccess(count());
        updateState({ swapStatus: "success" });

        return true;
      } catch (error: any) {
        analytics.onWrapFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [account, updateState, getFromTokenContract]
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
    fromAmount !== "0" &&
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
  const { slippage } = args;
  const fromTokenUsd = args.swapTypeIsBuy ? args.toTokenUsd : args.fromTokenUsd;
  const toTokenUsd = args.swapTypeIsBuy ? args.fromTokenUsd : args.toTokenUsd;

  const fromToken = args.swapTypeIsBuy ? args.toToken : args.fromToken;
  const toToken = args.swapTypeIsBuy ? args.fromToken : args.toToken;

  const { fromAmount, dexAmountOut } = useModifyAmounts({
    fromToken,
    toToken,
    fromAmount: args.fromAmount,
    fromAmountUI: args.fromAmountUI,
    dexAmountOut: args.dexAmountOut,
    dexAmountOutUI: args.dexAmountOutUI,
    ignoreSlippage: args.ignoreSlippage,
    slippage: args.slippage,
    swapTypeIsBuy: args.swapTypeIsBuy,
  });

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
    slippage,
  });

  const tradeOwner = useTradeOwner(quote?.outAmount, dexAmountOut);

  const initSwap = useCallback(() => {
    if (!fromToken || !toToken || !fromAmount) return;
    analytics.onInitSwap({
      fromToken,
      toToken,
      dexAmountOut,
      dstTokenUsdValue: toTokenUsd,
      srcAmount: fromAmount,
      slippage,
      tradeType: "BEST_TRADE",
      tradeOutAmount: tradeOwner === "dex" ? dexAmountOut : quote?.outAmount,
    });
  }, [
    fromToken,
    toToken,
    dexAmountOut,
    toTokenUsd,
    fromAmount,
    quote,
    slippage,
    tradeOwner,
  ]);

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
        onSwapSuccessDexCallback: onSwapSuccess,
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
      initSwap,
    ]
  );

  const noQuoteAmountOut = useMemo(() => {
    if (quoteLoading) {
      return false;
    }
    if (quote?.outAmount && new BN(quote?.outAmount).gt(0)) {
      return false;
    }

    return true;
  }, [quote?.outAmount, quoteLoading]);

  const swap = useSwap({
    fromAmount,
    fromToken,
    toToken,
    quote,
  });

  return {
    quote,
    noQuoteAmountOut,
    quoteLoading,
    quoteError,
    confirmSwap,
    swapLoading: swapStatus === "loading",
    swapError,
    tradeOwner,
    swap,
    analytics: {
      initSwap,
    },
  };
};
