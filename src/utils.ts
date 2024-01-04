import BN from "bignumber.js";
import { QUOTE_ERRORS } from "./consts";
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

export const shouldReturnZeroOutAmount = (error: string) => {
  return error === QUOTE_ERRORS.tns;
};
