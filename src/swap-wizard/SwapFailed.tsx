import { AlertCircle } from "react-feather";
import styled from "styled-components";
import { FlexRow, FlexColumn, Text } from "../styles";


export const SwapFailed = () => {

  return (
    <Container>
      <MainLogo>
        <AlertCircle />
      </MainLogo>
      <ErrorText>Swap failed</ErrorText>


    </Container>
  );
};

const ErrorText = styled(Text)`
  font-size: 20px;
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
