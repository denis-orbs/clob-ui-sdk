/* eslint-disable import/no-extraneous-dependencies */
import { useSwapState } from "../store";
import { Modal } from "../components";
import { SwapFailed } from "./SwapFailed";
import { SwapContent } from "./SwapContent";
import { SwapSuccess } from "./SwapSuccess";
import { useSubmitSwapState } from "../lib/hooks";

export function SwapWizard() {
  const va = useSubmitSwapState();

  console.log({ va });
  const isSuccess = false;
  const isError = false;

  const { showWizard, updateState } = useSwapState((store) => ({
    showWizard: store.showWizard,
    updateState: store.updateState,
    swapError: store.swapError,
  }));

  return (
    <Modal
      title="Review swap"
      open={showWizard}
      onClose={() => updateState({ showWizard: false })}
    >
      <>
        {isError ? (
          <SwapFailed />
        ) : isSuccess ? (
          <SwapSuccess />
        ) : (
          <SwapContent />
        )}
      </>
    </Modal>
  );
}
