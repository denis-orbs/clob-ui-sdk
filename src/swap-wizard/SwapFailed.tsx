import { AlertCircle } from "react-feather";
import styled from "styled-components";
import { useSwapState } from "../store";
import { FlexRow, FlexColumn, Text } from "../styles";


export const SwapFailed = () => {
  const swapError = useSwapState((store) => store.swapError);
  return (
    <Container>
      <MainLogo>
        <AlertCircle />
      </MainLogo>
      <Title>Swap failed</Title>
      <ErrorText>{swapError}</ErrorText>
    </Container>
  );
};

const ErrorText = styled(Text)`
  opacity: 0.6;
  font-size: 16px;
`

const Title = styled(Text)`
  font-size: 20px;
  font-weight: 500;
`;


const Container = styled(FlexColumn)`
  width: 100%;
  align-items: center;
  gap: 20px;
`;

const MainLogo = styled(FlexRow)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #ff3333;
  align-items: center;
  justify-content: center;
  svg {
    width: 60%;
    height: 60%;
    color: white;
  }
`;
