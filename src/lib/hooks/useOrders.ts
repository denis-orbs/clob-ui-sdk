import { useMemo } from "react";
import { useLiquidityHubPersistedStore } from "../../store";
import { useLHContext } from "../provider";

export const useOrders = () => {
  const { account, chainId } = useLHContext();
  const orders = useLiquidityHubPersistedStore((s) => s.orders);
  return useMemo(() => {
    if (!account || !chainId || !orders) return;
    return orders?.[account!]?.[chainId!];
  }, [account, chainId, orders]);
};


// if (!hasWeb3Instance()) {
//   setWeb3Instance(new Web3(provider as any));
// }

// const web3 = new Web3(provider as any);
// const contract = new web3.eth.Contract(
//   reactorABI as any,
//   REACTOR_ADDRESS
// );
// const latestBlock = await block();
// const targetDate = Date.parse("12 Nov 2023 00:12:00 GMT");
// const fromBlock = (await findBlock(targetDate)).number;

// let toBlock = latestBlock.number;

// const result = await getPastEvents({
//   contract,
//   eventName: "Fill",
//   filter: {
//     swapper: account!,
//   },
//   fromBlock,
//   toBlock,
//   maxDistanceBlocks: 100_000,
// });

// console.log(result);
