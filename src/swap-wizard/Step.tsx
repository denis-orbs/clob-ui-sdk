import { useMemo } from "react";
import styled from "styled-components";
import { Spinner } from "../components";
import { useSwapState } from "../store";
import { FlexColumn, FlexRow, Link } from "../styles";
import { ActionStatus, Step, STEPS } from "../types";
import { Check, X } from "react-feather";

interface Props {
  step: Step;
  type: STEPS;
}

export function StepComponent({ step, type }: Props) {
  const currentStep = useSwapState((store) => store.currentStep);
  const selected = type === currentStep;
  return (
    <StyledStep>
      <StyledStepLogo $selected={selected}>
        <img src={step.image} />
      </StyledStepLogo>
      <FlexColumn>
        <StyledStepTitle $selected={selected}>{step.title}</StyledStepTitle>
        {step.link && (
          <StyledStepLink
            href={step.link.href}
            target="_blank"
            $selected={selected}
          >
            {step.link.text}
          </StyledStepLink>
        )}
      </FlexColumn>

      <StepStatus status={step.status} />
    </StyledStep>
  );
}


const StyledStep = styled(FlexRow)`
  min-height: 40px;
  width: 100%;
`;


const StyledStepLogo = styled.div<{ $selected: boolean }>`
  width: 26px;
  height: 26px;
  position: relative;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    position: relative;
    z-index: 1;
    opacity: ${({ $selected }) => ($selected ? 1 : 0.5)};
  }
  &:after {
    content: "";
    position: absolute;
    width: calc(100% + 15px);
    height: calc(100% + 15px);
    transform: translate(-50%, -50%);
    top: 50%;
    left: 50%;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.mainBackground};
  }
  &:before {
    content: "";
    position: absolute;
    width: calc(100% + 13px);
    height: calc(100% + 13px);
    transform: translate(-50%, -50%);
    top: 50%;
    left: 50%;
    border-radius: 50%;
    border: 1px solid
      ${({ $selected }) => ($selected ? "rgba(0,0,0, 0.1)" : "transparent")};
    z-index: 1;
  }
`;

const StyledStepTitle = styled.p<{ $selected: boolean }>`
  color: ${({ $selected, theme }) =>
    $selected ? theme.colors.textMain : theme.colors.textSecondary};
`;
const StyledStepLink = styled(Link)<{ $selected: boolean }>`
 
`;

const StepStatus = ({ status }: { status: ActionStatus }) => {
  const element = useMemo(() => {
      if (status === "loading") {
        return <Spinner size={20} borderWidth={2} />
      }

      if (status === "success") {
        return <Check size={20} />;
      }

      if (status === "failed") {
        return <X size={20} />;
      }
  }, [status]);


  return <StyledStatus>{element}</StyledStatus>;
};




const StyledStatus = styled.div`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.textMain};
  * {
    color: ${({ theme }) => theme.colors.textMain};
  }
`


