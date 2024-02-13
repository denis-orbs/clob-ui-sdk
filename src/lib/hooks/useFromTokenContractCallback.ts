import { erc20abi, isNativeAddress } from "@defi.org/web3-candies";
import { useCallback } from "react";
import { useLHContext } from "../provider";
import { useWETHAddress } from "./useWethAddress";

export const useFromTokenContractCallback = () => {
  const { web3 } = useLHContext();

  const wethAddress = useWETHAddress();
  return useCallback(
    (address?: string) => {
      if (!address || !web3) return undefined;
      const _address = isNativeAddress(address) ? wethAddress : address;
      return _address ? new web3.eth.Contract(erc20abi, address) : undefined;
    },
    [web3, wethAddress]
  );
};
