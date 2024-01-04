/* eslint-disable import/no-extraneous-dependencies */
import { useSwapState } from "../store";
import { Modal } from "../components";
import { SwapFailed } from "./SwapFailed";
import { SwapContent } from "./SwapContent";
import { SwapSuccess } from "./SwapSuccess";
import { useSubmitSwapState } from "../lib/hooks";

export function SwapWizard() {
  const swapState = useSubmitSwapState();

  const { showWizard, onCloseWizard } = useSwapState((store) => ({
    showWizard: store.showWizard,
    onCloseWizard: store.onCloseWizard,
  }));

  return (
    <Modal title="Review swap" open={showWizard} onClose={onCloseWizard}>
      <>
        {swapState?.status === "error" ? (
          <SwapFailed />
        ) : swapState?.status === "success" ? (
          <SwapSuccess />
        ) : (
          <SwapContent />
        )}
      </>
    </Modal>
  );
}
