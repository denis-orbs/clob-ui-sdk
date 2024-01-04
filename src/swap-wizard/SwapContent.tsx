
import { StepComponent } from "./Step";
import styled from "styled-components";
import { useSwapSteps } from "../hooks";
import { SwapDetails } from "./Details";
import { FlexColumn } from "../styles";
import { Button, PoweredByOrbs } from "../components";
import { useSwapState } from "../store";
import { useMemo } from "react";
import { isNative } from "../lib";
import { useSubmitSwap } from "../lib/hooks";
import { STEPS } from "../lib/types";
export const SwapContent = () => {
  const steps = useSwapSteps();

  return (
    <Container>
      <SwapDetails />
      <StyledSteps $gap={15} style={{ width: "100%" }}>
        <Divider />
        {Object.keys(steps)?.map((key, index) => {
          const step = steps[key];
          return <StepComponent key={index} type={key as STEPS} step={step} />;
        })}
      </StyledSteps>
      <SubmitButton />
      <PoweredByOrbs />
    </Container>
  );
};

const SubmitButton = () => {
  const buttonText = useSubmitButtonText();

  const { mutate, isPending } = useSubmitSwap();

  if (isPending) return null;
  return <StyledSubmit onClick={mutate}>{buttonText}</StyledSubmit>;
};

const useSubmitButtonText = () => {
  const { fromToken, approved } = useSwapState((store) => ({
    fromToken: store.fromToken,
    approved: store.approved,
  }));

  return useMemo(() => {
    if (isNative(fromToken?.address)) {
      return "Wrap and swap";
    }
    if (!approved) {
      return "Approve and swap";
    }

    return "Sign and Swap";
  }, [approved, fromToken]);
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
