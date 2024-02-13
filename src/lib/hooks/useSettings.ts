import { useLiquidityHubPersistedStore } from "../../store";

export const useSettings = () => {
  const { liquidityHubEnabled, updateLiquidityHubEnabled } =
    useLiquidityHubPersistedStore();

  return {
    liquidityHubEnabled,
    updateLiquidityHubEnabled,
  };
};
