import {
  permit2Address,
  maxUint256,
  sendAndWaitForConfirmations,
  setWeb3Instance,
  signEIP712,
  zeroAddress,
  contract,
  erc20abi,
} from "@defi.org/web3-candies";
import { useMutation, useQuery } from "@tanstack/react-query";
import BN from "bignumber.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import Web3 from "web3";
import {
  STEPS,
  SubmitTxArgs,
  QuoteArgs,
  QuoteQueryArgs,
  QuoteResponse,
  Token,
  LH_CONTROL,
} from "../types";
import { analytics } from "../../analytics";
import {
  QUERY_KEYS,
  QUOTE_ERRORS,
} from "../../consts";
import { useLHContext } from "../providers";
import { useLiquidityHubPersistedStore, useSwapState } from "../../store";
import { isNative } from "lodash";
import { useDebounce, useWETHAddress } from "../../hooks";
import { amountBN, waitForTxResponse } from "../utils";
import { shouldReturnZeroOutAmount } from "../../utils";

const useApprove = (fromTokenAddress?: string) => {
  const { account } = useLHContext();
  const fromTokenContract = useFromTokenContract(fromTokenAddress);

  const { updateStepStatus } = useSwapState();
  return useCallback(
    async (srcAmount: string) => {
      if (!account) {
        throw new Error("No account");
      }
      updateStepStatus(STEPS.APPROVE, "loading");
      try {
        // liquidityHubAnalytics.onApprovalRequest();
        if (!fromTokenAddress || !srcAmount) {
          throw new Error("Missing data");
        }
        const tx = fromTokenContract?.methods.approve(
          permit2Address,
          maxUint256
        );

        await sendAndWaitForConfirmations(tx, { from: account });
        // liquidityHubAnalytics.onApprovalSuccess(count());
        updateStepStatus(STEPS.APPROVE, "success");
      } catch (error: any) {
        // liquidityHubAnalytics.onApprovalFailed(error.message, count());
        throw new Error(error.message);
      } finally {
      }
    },
    [account, updateStepStatus, fromTokenAddress]
  );
};

const useSign = () => {
  const { account, provider } = useLHContext();
  const { updateStepStatus } = useSwapState();

  return useCallback(
    async (permitData: any) => {
      updateStepStatus(STEPS.SIGN, "loading");
      try {
        if (!account || !provider) {
          throw new Error("No account or library");
        }
        // liquidityHubAnalytics.onSignatureRequest();
        setWeb3Instance(new Web3(provider));
        const signature = await signEIP712(account, permitData);
        // liquidityHubAnalytics.onSignatureSuccess(signature, count());
        updateStepStatus(STEPS.SIGN, "success");
        return signature;
      } catch (error: any) {
        // liquidityHubAnalytics.onSignatureFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [updateStepStatus, account, provider]
  );
};

const useFromTokenContract = (address?: string) => {
  const { provider } = useLHContext();

  return useMemo(() => {
    if (!address || !provider) return undefined;
    return contract(erc20abi, address);
  }, [address, provider]);
};

export const useApproved = (fromToken?: Token) => {
  const { account } = useLHContext();
  const fromTokenContract = useFromTokenContract(fromToken?.address);
  return useCallback(
    async (srcAmount: string) => {
      try {
        if (!account || !fromToken || !srcAmount || !fromTokenContract) {
          return false;
        }

        const allowance = await fromTokenContract?.methods
          ?.allowance(account, permit2Address)
          .call();

        return BN(allowance?.toString() || "0").gte(
          amountBN(fromToken, srcAmount)
        );
      } catch (error) {
        console.log({ error }, "approved error");

        return false;
      }
    },
    [account, fromToken?.address]
  );
};



const useSubmitTx = () => {
  const { provider, account, chainId, apiUrl } = useLHContext();
  const { updateStepStatus } = useSwapState();
  return useCallback(
    async (args: SubmitTxArgs) => {
      updateStepStatus(STEPS.SEND_TX, "loading");
      // const count = counter();
      try {
        // liquidityHubAnalytics.onSwapRequest();
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
        const tx = await waitForTxResponse(swap.txHash, new Web3(provider));
        // liquidityHubAnalytics.onSwapSuccess(swap.txHash, count());
        updateStepStatus(STEPS.SEND_TX, "success", { txHash: swap.txHash });

        return tx;
      } catch (error: any) {
        const message = error.message;
        // liquidityHubAnalytics.onSwapFailed(message, count());
        throw new Error(message);
      }
    },
    [provider, account, chainId, updateStepStatus]
  );
};

export const useSwap = () => {
  const sign = useSign();
  const submitTx = useSubmitTx();

  const {
    fromAmount,
    fromToken,
    toToken,
    quote,
    onSwapSuccess,
    onSwapError,
    approved,
    onSwapStart,
  } = useSwapState((store) => ({
    fromToken: store.fromToken,
    toToken: store.toToken,
    fromAmount: store.fromAmount,
    quote: store.quote,
    approved: store.approved,
    onSwapSuccess: store.onSwapSuccess,
    onSwapError: store.onSwapError,
    onSwapStart: store.onSwapStart,
  }));

  const approve = useApprove(fromToken?.address);
  const wrap = useWrap(fromToken);

  const wethAddress = useWETHAddress();
  return useMutation({
    mutationFn: async () => {
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
      const inAmountBN = amountBN(fromToken, fromAmount).toString();

      if (isNativeIn) {
        await wrap(fromAmount);
        inTokenAddress = wethAddress;
      }
      // analytics.onApprovedBeforeTheTrade(approved);
      if (!approved) {
        await approve(fromAmount);
      }

      const signature = await sign(quote.permitData);
      const tx = await submitTx({
        srcToken: inTokenAddress,
        destToken: outTokenAddress,
        srcAmount: inAmountBN,
        signature,
        quote,
      });
      onSwapSuccess();

      return tx;
    },
    onError: (error) => {
      console.log("error", error);
      onSwapError(error.message);
      analytics.onClobFailure();
    },
  });
};

const useWrap = (fromToken?: Token) => {
  const { account } = useLHContext();
  const { updateStepStatus } = useSwapState();
  const fromTokenContract = useFromTokenContract();
  return useCallback(
    async (srcAmount: string) => {
      if (!account) {
        throw new Error("Missing account");
      }
      if (!fromToken) {
        throw new Error("Missing from token");
      }
      if (!fromTokenContract) {
        throw new Error("Missing from token contract");
      }
      updateStepStatus(STEPS.WRAP, "loading");
      try {
        if (!fromToken || !srcAmount) return;
        const tx = fromTokenContract?.methods?.deposit();
        await sendAndWaitForConfirmations(tx, {
          from: account,
          value: amountBN(fromToken, srcAmount).toString(),
        });

        // setFromAddress(WBNB_ADDRESS);
        // analytics.onWrapSuccess(txHash, count());
        updateStepStatus(STEPS.WRAP, "success");
        return true;
      } catch (error: any) {
        // analytics.onWrapFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [account, updateStepStatus]
  );
};

export const useApproveQueryKey = (
  fromTokenAddress?: string,
  fromAmount?: string
) => {
  const { account, chainId } = useLHContext();

  return useMemo(() => {
    return [
      QUERY_KEYS.useApprovedQuery,
      account,
      chainId,
      fromTokenAddress,
      fromAmount,
    ];
  }, [account, fromTokenAddress, chainId, fromAmount]);
};

export const useAllowanceQuery = (fromToken?: Token, fromAmount?: string) => {
  const debouncedFromAmount = useDebounce(fromAmount, 400);
  const isApproved = useApproved(fromToken);
  const { provider } = useLHContext();
  const queryKey = useApproveQueryKey(fromToken?.address, debouncedFromAmount);
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!fromToken || !debouncedFromAmount) return false;
      const approved = await isApproved(debouncedFromAmount);
      return approved;
    },
    enabled: !!provider,
  });
};

const quote = async (args: QuoteArgs) => {
  try {
    const response = await fetch(
      `${args.apiUrl}/quote?chainId=${args.chainId}`,
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
  const { account, slippage, chainId, partner, quoteInterval, apiUrl } = useLHContext();
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
      apiUrl,
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
        apiUrl,
      });
      return res;
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

export const useIsClobTrade = (dexOutAmount?: string, lhOutAmount?: string) => {
  const { isFailed } = useSwapState();
  const { liquidityHubEnabled, lhControl } = useLiquidityHubPersistedStore();
  return useMemo(() => {
    if (!dexOutAmount || !lhOutAmount) return;

    if (lhControl === LH_CONTROL.SKIP || !liquidityHubEnabled) {
      return false;
    }
    if (lhControl === LH_CONTROL.FORCE) {
      console.log("LH force mode on");
      return true;
    }
    if (isFailed) {
      return true;
    }

    return new BN(lhOutAmount || "0").gt(new BN(dexOutAmount));
  }, [dexOutAmount, lhOutAmount, lhControl, isFailed, liquidityHubEnabled]);
};
