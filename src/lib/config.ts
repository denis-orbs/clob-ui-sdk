import { ChainConfig } from "./types";
import {networks} from "@defi.org/web3-candies"

export const REACTOR_ADDRESS = "0x21Da9737764527e75C17F1AB26Cb668b66dEE0a0";

export const chains: { [key: string]: ChainConfig } = {
  137: {
    explorerUrl: `https://polygonscan.com`,
    wTokenAddress: networks.poly.wToken.address,
  },
  56: {
    explorerUrl: `https://bscscan.com`,
    wTokenAddress: networks.bsc.wToken.address,
  },
};
