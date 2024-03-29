export interface QuoteArgs {
  inToken: string;
  outToken: string;
  inAmount: string;
  account?: string;
  slippage?: number;
  chainId: number;
  dexAmountOut?: string;
  signal?: AbortSignal;
  partner: string;
  apiUrl?: string;
}
export interface SendTxArgs {
  user: string;
  inToken: string;
  outToken: string;
  inAmount: string;
  outAmount: string;
  signature: string;
  quoteResult: any;
  chainId: number;
}

export interface ApproveArgs {
  user: string;
  inToken: string;
  inAmount: string;
  provider: any;
}

export interface SwapState {
  isWon: boolean;
  isFailed: boolean;
  outAmount?: string;
  waitingForApproval: boolean;
  waitingForSignature: boolean;
  isSwapping: boolean;
  isQuoting: boolean;
  updateState: (state: Partial<SwapState>) => void;
}

export interface SubmitTxArgs {
  srcToken: string;
  destToken: string;
  srcAmount: string;
  signature: string;
  quote: QuoteResponse;
}

export interface UseSwapCallback {
  fromToken?: Token;
  toToken?: Token;
  fromAmount?: string;
  quote?: QuoteResponse;
  approved?: boolean;
}

export interface QuoteResponse {
  outAmount: string;
  permitData: any;
  serializedOrder: string;
  callData: string;
  rawData: any;
  outAmountUI: string;
  outAmountUIWithSlippage?: string;
}

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
  logoUrl?: string;
}

export enum LH_CONTROL {
  FORCE = "1",
  SKIP = "2",
  RESET = "3",
}

export enum STEPS {
  WRAP,
  APPROVE,
  SIGN,
  SEND_TX,
}

export type ActionStatus = "loading" | "success" | "failed" | undefined;

export interface Step {
  title: string;
  loadingTitle: string;
  link?: { href: string; text: string };
  image?: string;
  hidden?: boolean;
  id: STEPS;
}

export type QuoteQueryArgs = {
  fromToken?: Token;
  toToken?: Token;
  fromAmount?: string;
  dexAmountOut?: string;
  slippage?: number;
  swapTypeIsBuy?: boolean;
};

export type ChainConfig = {
  explorerUrl: string;
  wTokenAddress: string;
};

export type UseLiquidityHubArgs = {
  fromToken?: Token;
  toToken?: Token;
  fromAmount?: string;
  fromAmountUI?: string;
  fromTokenUsd?: string | number;
  toTokenUsd?: string | number;
  dexAmountOut?: string;
  dexAmountOutUI?: string;
  slippage?: number;
  swapTypeIsBuy?: boolean;
  ignoreSlippage?: boolean;
};

export type UseConfirmSwap = {
  args: UseLiquidityHubArgs;
  quote?: QuoteResponse;
  tradeOwner?: TradeOwner;
};

export type ConfirmSwapCallback = {
  onSuccess?: () => void;
  fallback?: () => void;
}

export type TradeOwner = "dex" | "lh";


export type Order = {
  id: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  fromAmountUsd?: string;
};

export type Orders = { [address: string]: { [chain: string]: Order[] } };
