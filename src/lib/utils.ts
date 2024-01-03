import { isNativeAddress, TokenData, parsebn } from "@defi.org/web3-candies";
import BN from "bignumber.js";
import Web3 from "web3";

export const isNative = (address?: string) => isNativeAddress(address || "");
export const amountBN = (token: TokenData, amount: string) =>
  parsebn(amount).times(new BN(10).pow(token?.decimals || 0));
export const amountUi = (token: TokenData, amount: BN) => {
  if (!token) return "";
  const percision = new BN(10).pow(token?.decimals || 0);
  return amount.times(percision).idiv(percision).div(percision).toString();
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForTxResponse(txHash: string, provider: any) {
  const web3 = new Web3(provider);
  for (let i = 0; i < 30; ++i) {
    // due to swap being fetch and not web3

    await delay(3_000); // to avoid potential rate limiting from public rpc
    try {
      const tx = await web3.eth.getTransaction(txHash);
      if (tx && tx instanceof Object && tx.blockNumber) {
        return tx;
      }
    } catch (error) {
      /* empty */
    }
  }
}
