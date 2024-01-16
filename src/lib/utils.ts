import { isNativeAddress, TokenData, parsebn } from "@defi.org/web3-candies";
import BN from "bignumber.js";
import Web3 from "web3";

export const isNative = (address?: string) => isNativeAddress(address || "");
export const amountBN = (token: TokenData, amount: string) =>
  parsebn(amount).times(new BN(10).pow(token?.decimals || 0));
export const amountUi = (decimals?: number, amount?: BN) => {
  if (!decimals || !amount) return "";
  const percision = new BN(10).pow(decimals || 0);
  return amount.times(percision).idiv(percision).div(percision).toString();
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForTxReceipt(web3: Web3, txHash: string) {
  for (let i = 0; i < 30; ++i) {
    // due to swap being fetch and not web3

    await delay(3_000); // to avoid potential rate limiting from public rpc
    try {
      const { mined, revertMessage } = await getTransactionDetails(
        web3,
        txHash
      );

      if (mined) {
        return true;
      }
      if(revertMessage) {
        throw new Error(revertMessage);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

export const counter = () => {
  const now = Date.now();

  return () => {
    return Date.now() - now;
  };
};

export async function getTransactionDetails(
  web3: Web3,
  txHash: string
): Promise<{ mined: boolean; revertMessage?: string }> {
  try {
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    console.log({ receipt });
    
    if (!receipt) {
      return {
        mined: false,
      };
    }

    const mined = receipt.status ? true : false;

    let revertMessage = "";

    if (!receipt.status) {
      // If the transaction was reverted, try to get the revert reason.
      try {
        const tx = await web3.eth.getTransaction(txHash);
        const code = await web3.eth.call(tx as any, tx.blockNumber!);
        revertMessage = web3.utils.toAscii(code).replace(/\0/g, ""); // Convert the result to a readable string
      } catch (err) {
        revertMessage = "Unable to retrieve revert reason";
      }
    }

    return {
      mined,
      revertMessage,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch transaction details: ${error.message}`);
  }
}
