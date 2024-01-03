import { contract, erc20abi } from "@defi.org/web3-candies";
import BN from "bignumber.js";
import { QUOTE_ERRORS } from "./consts";
import { useSwapState } from "./store";
import { TokenFromDapp } from "./types";
export const counter = () => {
  const now = Date.now();

  return () => {
    return Date.now() - now;
  };
};

export const deductSlippage = (slippage: number, amount?: string) => {
  if (!amount) return "";
  return BN(amount || "0")
    .times(100 - slippage)
    .div(100)
    .toString();
};

export const getLogoUrl = (token?: TokenFromDapp) => {
  if (!token) return "";
  if (token.logoUrl) return token.logoUrl;
  if (token.logoURI) return token.logoURI;
  return "";
};

export const shouldReturnZeroOutAmount = (error: string) => {
  return error === QUOTE_ERRORS.tns;
};

export const getFromTokenContract = () => {
  const address = useSwapState.getState().fromToken?.address;
  if (!address) return undefined;
  return contract(erc20abi, address);
};