import { permit2Address } from "@defi.org/web3-candies";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { Token } from "..";
import { QUERY_KEYS } from "../consts";
import { useLHContext } from "../provider";
import BN from "bignumber.js";
import { useFromTokenContractCallback } from "./useFromTokenContractCallback";
import { useDebounce } from "./useDebounce";

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


export const useAllowance = (fromToken?: Token, fromAmount?: string) => {
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
