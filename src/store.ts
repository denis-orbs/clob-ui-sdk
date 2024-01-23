import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  STEPS,
  ActionStatus,
  LH_CONTROL,
  Token,
  QuoteResponse,
} from "./lib/types";

interface SwapStateValues {
  currentStep?: STEPS;
  showWizard?: boolean;
  fromToken?: Token;
  toToken?: Token;
  fromAmount?: string;
  fromTokenUsd?: string | number;
  toTokenUsd?: string | number;
  isFailed?: boolean;
  failures?: number;
  txHash?: string;
  quote?: QuoteResponse;
  swapStatus: ActionStatus;
  swapError?: string;
  onSwapSuccessDexCallback?: () => void;
}

interface SwapState extends SwapStateValues {
  updateState: (state: Partial<SwapState>) => void;
  onSwapError: (error: string) => void;
  onSwapSuccess: () => void;
  onSwapStart: () => void;
  onCloseSwap: () => void;
}

const initialSwapState: SwapStateValues = {
  currentStep: undefined,
  fromToken: undefined,
  toToken: undefined,
  fromAmount: undefined,
  fromTokenUsd: undefined,
  toTokenUsd: undefined,
  showWizard: false,
  isFailed: false,
  failures: 0,
  txHash: undefined,
  quote: undefined,
  swapStatus: undefined,
  swapError: undefined,
  onSwapSuccessDexCallback: undefined,
};

export const useSwapState = create<SwapState>((set, get) => ({
  ...initialSwapState,
  onSwapStart: () => set({ swapStatus: "loading" }),
  updateState: (state) => set({ ...state }),
  onSwapSuccess: () => {
    set({
      isFailed: false,
      failures: 0,
      swapStatus: "success",
    });
  },
  onSwapError: (swapError) =>
    set((state) => {
      const failures = (state.failures || 0) + 1;
      return {
        failures,
        isFailed: failures > 2,
        swapError,
        swapStatus: "failed",
      };
    }),
  onCloseSwap: () => {
    set({
      showWizard: false,
    });

    if (get().swapStatus !== "loading") {
      setTimeout(() => {
        set(initialSwapState);
      }, 200);
    }
  },
}));

interface LHControlStore {
  lhControl?: LH_CONTROL;
  setLHControl: (lhControl?: LH_CONTROL) => void;
  liquidityHubEnabled: boolean;
  updateLiquidityHubEnabled: () => void;
}
export const useLiquidityHubPersistedStore = create(
  persist<LHControlStore>(
    (set, get) => ({
      lhControl: undefined,
      setLHControl: (lhControl) => set({ lhControl }),
      liquidityHubEnabled: true,
      updateLiquidityHubEnabled: () =>
        set({ liquidityHubEnabled: !get().liquidityHubEnabled }),
    }),
    {
      name: "liquidity-hub-control",
    }
  )
);
