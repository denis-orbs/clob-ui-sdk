import { StepComponent } from "./Step";
import styled from "styled-components";
import { SwapDetails } from "./Details";
import { FlexColumn, Skeleton } from "../styles";
import { Button, PoweredByOrbs } from "../components";
import { useSubmitButton, useSwapSteps } from "../lib/hooks";
export const SwapMain = () => {
  return (
    <Container>
      <SwapDetails />
      <StepsComponent />
      <PoweredByOrbs />
    </Container>
  );
};

const StepsComponent = () => {
  const { steps, isLoading: stepsLoading } = useSwapSteps();

  if (stepsLoading) {
    return (
      <StyledLoader>
        <StyledSkeleton />
        <StyledSkeleton style={{
          width: "70%",
        }} />

      </StyledLoader>
    );
  }

  return (
    <>
      <StyledSteps $gap={15} style={{ width: "100%" }}>
        <Divider />
        {steps.map((step) => {
          return <StepComponent key={step.id} step={step} />;
        })}
      </StyledSteps>
      <SubmitButton />
    </>
  );
};

const StyledLoader = styled(FlexColumn)`
width: 100%;
`

const StyledSkeleton = styled(Skeleton)``

const SubmitButton = () => {
  const { text, onClick, isPending } = useSubmitButton();

  if (isPending) return null;
  return <StyledSubmit onClick={onClick}>{text}</StyledSubmit>;
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
