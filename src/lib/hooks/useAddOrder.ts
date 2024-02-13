import { useCallback } from "react";
import { useLiquidityHubPersistedStore } from "../../store";
import { useLHContext } from "../provider";
import { Order } from "../types";


export const useAddOrder = () => {
  const addOrder = useLiquidityHubPersistedStore((s) => s.addOrder);
  const { account, chainId } = useLHContext();
  return useCallback(
    (order: Order) => {
      if (!account || !chainId) return;
      addOrder(account, chainId, order);
    },
    [addOrder, account, chainId]
  );
};
