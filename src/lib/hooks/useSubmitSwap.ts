import {
  permit2Address,
  maxUint256,
  sendAndWaitForConfirmations,
  setWeb3Instance,
  signEIP712,
  zeroAddress,
} from "@defi.org/web3-candies";
import {
  QueryKey,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import BN from "bignumber.js";
import { useCallback, useMemo } from "react";
import Web3 from "web3";
import { TokenFromDapp, STEPS, SubmitTxArgs, SwapArgs } from "../../types";
import { analytics } from "../../analytics";
import { API_ENDPOINT, QUERY_KEYS } from "../../consts";
import { useLHContext } from "../providers";
import { useSwapState } from "../../store";
import { isNative } from "lodash";
import { useDebounce, useWETHAddress } from "../../hooks";
import { getFromTokenContract } from "../../utils";
import { amountBN, waitForTxResponse } from "../utils";

const useApprove = () => {
  const { account } = useLHContext();

  const { updateState } = useSwapState();
  return useCallback(
    async (fromToken: TokenFromDapp, srcAmount: string) => {
      if (!account) {
        throw new Error("No account");
      }
      updateState({ approveStatus: "loading" });
      try {
        // liquidityHubAnalytics.onApprovalRequest();
        if (!fromToken || !srcAmount) {
          throw new Error("Missing data");
        }
        const tx = getFromTokenContract()?.methods.approve(
          permit2Address,
          maxUint256
        );

        await sendAndWaitForConfirmations(tx, { from: account });
        // liquidityHubAnalytics.onApprovalSuccess(count());
        updateState({ approveStatus: "success", currentStep: STEPS.SIGN });
      } catch (error: any) {
        // liquidityHubAnalytics.onApprovalFailed(error.message, count());
        updateState({ approveStatus: "failed" });
        throw new Error(error.message);
      } finally {
      }
    },
    [account, updateState]
  );
};

const useSign = () => {
  const { account, provider } = useLHContext();
  const { updateState } = useSwapState();
  return useCallback(
    async (permitData: any) => {
      updateState({ signStatus: "loading" });
      try {
        if (!account || !provider) {
          throw new Error("No account or library");
        }
        // onSetLiquidityHubState({ waitingForSignature: true });
        // liquidityHubAnalytics.onSignatureRequest();
        setWeb3Instance(new Web3(provider));
        const signature = await signEIP712(account, permitData);
        // liquidityHubAnalytics.onSignatureSuccess(signature, count());
        updateState({ signStatus: "success", currentStep: STEPS.SEND_TX });
        return signature;
      } catch (error: any) {
        updateState({ signStatus: "failed" });
        // liquidityHubAnalytics.onSignatureFailed(error.message, count());
        throw new Error(error.message);
      } finally {
        // onSetLiquidityHubState({ waitingForSignature: false });
      }
    },
    [updateState, account, provider]
  );
};

export const useApproved = () => {
  const { account } = useLHContext();
  return useCallback(
    async (fromToken: TokenFromDapp, srcAmount: string) => {
      try {
        if (!account || !fromToken || !srcAmount) {
          return false;
        }

        const allowance = await getFromTokenContract()
          ?.methods?.allowance(account, permit2Address)
          .call();

        return BN(allowance?.toString() || "0").gte(
          amountBN(fromToken, srcAmount)
        );
      } catch (error) {
        console.log({ error }, "approved error");

        return false;
      }
    },
    [account]
  );
};

const useSubmitTx = () => {
  const { provider, account, chainId } = useLHContext();
  const { updateState } = useSwapState();
  return useCallback(
    async (args: SubmitTxArgs) => {
      updateState({ sendTxStatus: "loading" });
      // const count = counter();
      try {
        // liquidityHubAnalytics.onSwapRequest();
        const txHashResponse = await fetch(
          `${API_ENDPOINT}/swapx?chainId=${chainId}`,
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

        updateState({
          sendTxStatus: "success",
          swapFinished: true,
          txHash: swap.txHash,
        });
        return tx;
      } catch (error: any) {
        updateState({ sendTxStatus: "failed" });
        const message = error.message;
        // liquidityHubAnalytics.onSwapFailed(message, count());
        throw new Error(message);
      }
    },
    [provider, account, chainId, updateState]
  );
};

export const useSubmitSwap = () => {
  const wrap = useWrap();
  const sign = useSign();
  const submitTx = useSubmitTx();
  const approve = useApprove();

  const {
    fromAmount,
    fromToken,
    toToken,
    quote,
    onSwapSuccess,
    onSwapError,
    approved,
  } = useSwapState((store) => ({
    fromToken: store.fromToken,
    toToken: store.toToken,
    fromAmount: store.fromAmount,
    quote: store.quote,
    approved: store.approved,
    onSwapSuccess: store.onSwapSuccess,
    onSwapError: store.onSwapError,
  }));
  const wethAddress = useWETHAddress();
  const mutationKey = useSubmitSwapMutationKey();
  return useMutation({
    mutationKey,
    mutationFn: async () => {
      if (!fromToken || !toToken || !fromAmount || !wethAddress || !quote) {
        throw new Error("Missing from or to token");
      }
      const isNativeIn = isNative(fromToken.address);
      const isNativeOut = isNative(toToken.address);

      let inTokenAddress = isNativeIn ? zeroAddress : fromToken.address;
      const outTokenAddress = isNativeOut ? zeroAddress : toToken.address;
      const inAmountBN = amountBN(fromToken, fromAmount).toString();

      if (isNativeIn) {
        await wrap(fromToken, fromAmount);
        inTokenAddress = wethAddress;
      }
      // analytics.onApprovedBeforeTheTrade(approved);
      if (!approved) {
        await approve(fromToken, fromAmount);
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

const useWrap = () => {
  const { account } = useLHContext();
  const { updateState } = useSwapState();
  return useCallback(
    async (fromToken: TokenFromDapp, srcAmount: string) => {
      if (!account) {
        throw new Error("Missing account");
      }
      updateState({ wrapStatus: "loading" });
      try {
        if (!fromToken || !srcAmount) return;
        const tx = getFromTokenContract()?.methods?.deposit();
        await sendAndWaitForConfirmations(tx, {
          from: account,
          value: amountBN(fromToken, srcAmount).toString(),
        });

        // setFromAddress(WBNB_ADDRESS);
        // analytics.onWrapSuccess(txHash, count());
        updateState({ wrapStatus: "success", currentStep: STEPS.APPROVE });
        return true;
      } catch (error: any) {
        updateState({ wrapStatus: "failed" });
        // analytics.onWrapFailed(error.message, count());
        throw new Error(error.message);
      }
    },
    [account, updateState]
  );
};

const useSubmitSwapMutationKey = (): QueryKey => {
  const { fromAmount, fromToken, toToken, quote } = useSwapState((store) => ({
    fromToken: store.fromToken,
    toToken: store.toToken,
    fromAmount: store.fromAmount,
    quote: store.quote,
  }));

  return useMemo(() => {
    return [
      QUERY_KEYS.useSubmitSwap,
      fromToken?.address,
      toToken?.address,
      fromAmount,
      quote?.outAmount,
    ];
  }, [fromToken, toToken, fromAmount, quote?.outAmount]);
};

export const useSubmitSwapState = () => {
  const mutationKey = useSubmitSwapMutationKey();
  return useMutationState({
    // this mutation key needs to match the mutation key of the given mutation (see above)
    filters: { mutationKey },
    select: (mutation) => mutation.state,
  });
};

export const useSwap = (args: SwapArgs) => {
  const initSwap = useSwapState((store) => store.initSwap);
  useApprovedQuery(args.fromToken, args.fromAmount);
  const queryKey = useApproveQueryKey(args.fromToken, args.fromAmount);

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!args.fromToken || !args.toToken || !args.fromAmount || !args.quote) {
        return;
      }
      return queryClient.ensureQueryData({ queryKey }) as Promise<boolean>;
    },
    onSuccess: (approved) => {
      initSwap({
        fromToken: args.fromToken,
        toToken: args.toToken,
        fromAmount: args.fromAmount,
        fromTokenUsd: args.fromTokenUsd,
        toTokenUsd: args.toTokenUsd,
        quote: args.quote,
        approved,
      });
    },
  });
};

const useApproveQueryKey = (fromToken?: TokenFromDapp, fromAmount?: string) => {
  const { account, chainId } = useLHContext();

  return useMemo(() => {
    return [
      QUERY_KEYS.useApprovedQuery,
      account,
      chainId,
      fromToken?.address,
      fromAmount,
    ];
  }, [account, fromToken, chainId, fromAmount]);
};

export const useApprovedQuery = (
  fromToken?: TokenFromDapp,
  fromAmount?: string
) => {
  const debouncedFromAmount = useDebounce(fromAmount, 400);
  const isApproved = useApproved();
  const queryKey = useApproveQueryKey(fromToken, debouncedFromAmount);
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!fromToken || !debouncedFromAmount) return false;
      return isApproved(fromToken, debouncedFromAmount);
    },
  });
};
