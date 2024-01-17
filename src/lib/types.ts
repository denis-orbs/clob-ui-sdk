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

type analyticsActionState = "pending" | "success" | "failed" | "null" | "";

export interface AnalyticsData {
  _id: string;
  partner: string;
  chainId: number;
  isForceClob: boolean;
  firstFailureSessionId?: string;
  sessionId?: string;
  walletAddress: string;
  dexAmountOut: string;
  isClobTrade: boolean;
  srcTokenAddress: string;
  srcTokenSymbol: string;
  dstTokenAddress: string;
  dstTokenSymbol: string;
  srcAmount: string;
  quoteIndex: number;
  slippage: number;
  quoteState: analyticsActionState;
  clobDexPriceDiffPercent: string;

  approvalState: analyticsActionState;
  approvalError: string;
  approvalMillis: number | null;

  signatureState: analyticsActionState;
  signatureMillis: number | null;
  signature: string;
  signatureError: string;

  swapState: analyticsActionState;
  txHash: string;
  swapMillis: number | null;
  swapError: string;

  wrapState: analyticsActionState;
  wrapMillis: number | null;
  wrapError: string;
  wrapTxHash: string;

  dexSwapState: analyticsActionState;
  dexSwapError: string;
  dexSwapTxHash: string;

  userWasApprovedBeforeTheTrade?: boolean | string;
  dstAmountOutUsd: number;
  isProMode: boolean;
  expertMode: boolean;
  tradeType?: string;
  isNotClobTradeReason: string;
  onChainClobSwapState: analyticsActionState;
  version: number;
  isDexTrade: boolean;
  onChainDexSwapState: analyticsActionState;

  quoteAmountOut?: string;
  quoteSerializedOrder?: string;
  quoteMillis?: number;
  quoteError?: string;
}
export enum SwapControl {
  FORCE = "1",
  SKIP = "2",
}

export interface QuoteResponse {
  outAmount: string;
  permitData: any;
  serializedOrder: string;
  callData: string;
  rawData: any;
  outAmountUI: string;
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
  WRAP = "wrap",
  APPROVE = "approve",
  SEND_TX = "swap",
  SIGN = "sign",
}

export type ActionStatus = "loading" | "success" | "failed" | undefined;

export interface Step {
  title: string;
  loadingTitle: string;
  link?: { href: string; text: string };
  image?: string;
  hidden?: boolean;
}

export type partner = "quickswap" | "thena";

export type QuoteQueryArgs = {
  fromToken?: Token;
  toToken?: Token;
  fromAmount?: string;
  dexAmountOut?: string;
  slippage?: number;
};

export type Partner = {
  name: string;
  explorerUrl: string;
  normalizeToken: (token: any) => Token;
};

export type QuickSwapToken = {
  decimals: number;
  symbol: string;
  name: string;
  chainId: number;
  address: string;
  tokenInfo: {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    chainId: number;
    logoURI: string;
  };
  tags: any[];
  isNative: boolean;
  isToken: boolean;
};

export type ThenaToken = {
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
  address: string;
  logoURI: string;
};

export type DappToken = ThenaToken | QuickSwapToken;

export type AnalyticsInitTradeArgs = {
  srcToken?: Token;
  dstToken?: Token;
  walletAddress?: string;
  slippage?: number;
  srcAmount?: string;
  dexAmountOut?: string;
  dstTokenUsdValue?: string;
  quoteOutAmount?: string;
};

export type UseLiquidityHubArgs = {
  fromToken?: any;
  toToken?: any;
  fromAmount?: string;
  fromAmountUI?: string;
  fromTokenUsd?: string | number;
  toTokenUsd?: string | number;
  dexAmountOut?: string;
  dexAmountOutUI?: string;
  slippage?: number;
};

export interface OnSwapCallbackArgs extends UseLiquidityHubArgs {
  dexSwap?: () => void;
}
