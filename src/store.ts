import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ActionStatus, LH_CONTROL, STEPS, TokenFromDapp } from "./types";

interface SwapState {
  currentStep?: STEPS;
  showWizard?: boolean;
  fromToken?: TokenFromDapp;
  toToken?: TokenFromDapp;
  fromAmount?: string;
  fromTokenUsd?: string;
  toTokenUsd?: string;
  swapInProgress?: boolean;
  isFailed?: boolean;
  failures?: number;
  wrapStatus?: ActionStatus;
  approveStatus?: ActionStatus;
  sendTxStatus?: ActionStatus;
  signStatus?: ActionStatus;
  swapFinished?: boolean;
  txHash?: string;
  quote?: any;
  approved?: boolean;
  swapError?: string;

  updateState: (state: Partial<SwapState>) => void;
  initSwap: (values: Partial<SwapState>) => void;
  reset: () => void;
  onSwapError: (error: string) => void;
  onSwapSuccess: () => void;
}

const initialSwapState: Partial<SwapState> = {
  wrapStatus: undefined,
  approveStatus: undefined,
  sendTxStatus: undefined,
  signStatus: undefined,
  currentStep: undefined,
  fromToken: undefined,
  toToken: undefined,
  fromAmount: undefined,
  fromTokenUsd: undefined,
  toTokenUsd: undefined,
  showWizard: false,
  swapInProgress: false,
  isFailed: false,
  failures: 0,
  swapFinished: false,
  txHash: undefined,
  quote: undefined,
  approved: undefined,
  swapError: undefined,
};

export const useSwapState = create<SwapState>((set) => ({
  ...initialSwapState,
  updateState: (state) => set({ ...state }),
  initSwap: (values) =>
    set({
      ...values,
      wrapStatus: undefined,
      approveStatus: undefined,
      sendTxStatus: undefined,
      signStatus: undefined,
      currentStep: undefined,
      showWizard: true,
      swapError: undefined,
      swapInProgress: true,
    }),
  reset: () => set({ ...initialSwapState }),
  onSwapSuccess: () =>
    set({
      swapInProgress: false,
      isFailed: false,
      failures: 0,
    }),

  onSwapError: (error) =>
    set((state) => {
      const failures = (state.failures || 0) + 1;
      return {
        failures,
        isFailed: failures > 2,
        swapInProgress: false,
        swapError: error,
      };
    }),
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
