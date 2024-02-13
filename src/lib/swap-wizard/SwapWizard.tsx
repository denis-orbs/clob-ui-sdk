/* eslint-disable import/no-extraneous-dependencies */
import { useSwapState } from "../../store";
import { Modal } from "../components";
import { SwapMain } from "./SwapMain";
import { SwapSuccess } from "./SwapSuccess";
import styled from "styled-components";
import { SwapFailed } from "./SwapFailed";
import { useMemo } from "react";

export function SwapWizard() {
  const { swapStatus, onCloseSwap } = useSwapState((store) => ({
    swapStatus: store.swapStatus,
    onCloseSwap: store.onCloseSwap,
  }));

  const { showWizard } = useSwapState((store) => ({
    showWizard: store.showWizard,
  }));

  const modalTitle = useMemo(() => {
    if (swapStatus === "success") {
      return "Swap completed";
    }
    if (swapStatus === "failed") {
      return "";
    }
    return "Review swap";
  }, [swapStatus]);

  return (
    <Modal title={modalTitle} open={showWizard} onClose={onCloseSwap} 
    contentStyles={{
      maxWidth: "420px",
    }}>
      <Container>
        {swapStatus === "success" ? (
          <SwapSuccess />
        ) : swapStatus === "failed" ? (
          <SwapFailed />
        ) : (
          <SwapMain />
        )}
      </Container>
    </Modal>
  );
}

const Container = styled.div`
  width: 100%;
  * {
    box-sizing: border-box;
  }
`;
