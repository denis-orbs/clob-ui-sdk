import { zeroAddress } from "@defi.org/web3-candies";
import { Partner, Token } from "./types";

export const quickswapTokenNormalize = (token: any): Token => {
  return {
    address: token.address || zeroAddress,
    symbol: token.symbol,
    decimals: token.decimals,
    logoUrl: token.tokenInfo
      ? token.tokenInfo.logoURI
      : "https://quickswap.exchange/MATIC.png",
  };
};


export const thenaTokenNormalize = (token: any): Token => {
    return {
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      logoUrl: token.logoURI?.replace("_1", ""),
    };
}

export const partners: { [key: string]: Partner } = {
  quickswap: {
    name: "QuickSwap",
    explorerUrl: `https://polygonscan.com`,
    normalizeToken: quickswapTokenNormalize,
  },
  thena: {
    name: "Thena",
    explorerUrl: `https://bscscan.com`,
    normalizeToken: thenaTokenNormalize,
  },
};