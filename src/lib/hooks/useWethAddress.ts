import { useMemo } from "react";
import { WETH } from "../consts";
import { useLHContext } from "../provider";

export const useWETHAddress = () => {
  const { chainId } = useLHContext();

  return useMemo(() => {
    if (!chainId) return;
    return WETH[chainId];
  }, [chainId]);
};
