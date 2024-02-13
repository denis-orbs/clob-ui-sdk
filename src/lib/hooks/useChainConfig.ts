import { useMemo } from "react";
import { chains } from "../config";
import { useLHContext } from "../provider";

export const useChainConfig = () => {
  const chainId = useLHContext().chainId;

  return useMemo(() => {
    if (!chainId) {
      console.error("ChainId is not set");
      return;
    }
    return chains[chainId];
  }, [chainId]);
};
