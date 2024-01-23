import { StepComponent } from "./Step";
import styled from "styled-components";
import { SwapDetails } from "./Details";
import { FlexColumn } from "../styles";
import { Button, PoweredByOrbs } from "../components";
import { useSwapState } from "../store";
import { useMemo } from "react";
import { useSwapSteps } from "../lib/hooks";
import { useAllowanceQuery, useSwap } from "../lib/swap-logic";
import { isNative } from "../lib/utils";
export const SwapMain = () => {
  const steps = useSwapSteps();

  return (
    <Container>
      <SwapDetails />
      {!steps ? null : (
        <>
          <StyledSteps $gap={15} style={{ width: "100%" }}>
            <Divider />
            {steps?.map((step) => {
              return <StepComponent key={step.id} step={step} />;
            })}
          </StyledSteps>
          <SubmitButton />
        </>
      )}
      <PoweredByOrbs />
    </Container>
  );
};

const SubmitButton = () => {
  const { text, onClick, isPending } = useSubmitButton();

  if (isPending) return null;
  return <StyledSubmit onClick={onClick}>{text}</StyledSubmit>;
};

const useSubmitButton = () => {
  const { fromToken, fromAmount, quote, toToken, onSwapSuccessDexCallback } =
    useSwapState((store) => ({
      fromToken: store.fromToken,
      fromAmount: store.fromAmount,
      toToken: store.toToken,
      quote: store.quote,
      onSwapSuccessDexCallback: store.onSwapSuccessDexCallback,
    }));
  const isPending = useSwapState((store) => store.swapStatus) === "loading";
  const { data: approved } = useAllowanceQuery(fromToken, fromAmount);

  const swap = useSwap({
    fromToken,
    fromAmount,
    toToken,
    quote,
  });

  return useMemo(() => {
    const getText = () => {
      if (isNative(fromToken?.address)) return "Wrap and swap";
      if (!approved) return "Approve and swap";
      return "Sign and Swap";
    };

    return {
      text: getText(),
      onClick: () => swap(onSwapSuccessDexCallback),
      isPending,
    };
  }, [approved, fromToken, isPending, swap, onSwapSuccessDexCallback]);
};

const Container = styled(FlexColumn)`
  width: 100%;
`;

const StyledSubmit = styled(Button)`
  width: 100%;
  margin-top: 20px;
`;

const Divider = styled.div`
  width: 2.5px;
  height: calc(100% - 50px);
  background-color: #e5e5e5;
  left: 12px;
  position: absolute;
  top: 40px;
`;

const StyledSteps = styled(FlexColumn)`
  margin-top: 35px;
  border-top: 1px solid ${(props) => props.theme.colors.divider};
  padding-top: 25px;
  position: relative;
  background-color: ${(props) => props.theme.colors.onyx};
`;
