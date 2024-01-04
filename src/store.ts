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
  fromTokenUsd?: string;
  toTokenUsd?: string;
  isFailed?: boolean;
  failures?: number;
  txHash?: string;
  quote?: QuoteResponse;
  approved?: boolean;
  stepStatuses: { [key: string]: ActionStatus };
}

interface SwapState extends SwapStateValues {
  updateStepStatus: (step: STEPS, status: ActionStatus, data?: Partial<SwapStateValues>) => void;
  updateState: (state: Partial<SwapState>) => void;
  initSwap: (values: Partial<SwapState>) => void;
  reset: () => void;
  onSwapError: (error: string) => void;
  onSwapSuccess: () => void;
  onCloseWizard: () => void;
}

const initialStepStatuses = {
  [STEPS.WRAP]: undefined,
  [STEPS.APPROVE]: undefined,
  [STEPS.SEND_TX]: undefined,
  [STEPS.SIGN]: undefined,
};

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
  approved: undefined,
  stepStatuses: initialStepStatuses,
};

export const useSwapState = create<SwapState>((set) => ({
  ...initialSwapState,
  onCloseWizard: () =>
    set({
      showWizard: false,
      currentStep: undefined,
      stepStatuses: initialStepStatuses,
    }),
  updateStepStatus: (step, status, data = {}) =>
    set((state) => {
      const stepStatuses = state.stepStatuses || {};
      stepStatuses[step] = status;
      return {
        stepStatuses,
        currentStep: status === "loading" ? step : state.currentStep,
        ...data,
      };
    }),

  updateState: (state) => set({ ...state }),
  initSwap: (values) =>
    set({
      ...values,
      showWizard: true,
    }),
  reset: () => set({ ...initialSwapState }),

  onSwapSuccess: () =>
    set({
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
