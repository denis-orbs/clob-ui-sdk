import { Check, ArrowRight } from "react-feather";
import styled from "styled-components";
import { Logo } from "../components";
import { usePartner } from "../hooks";
import { useSwapState } from "../store";
import { FlexRow, FlexColumn, Text, Link } from "../styles";
import { TokenFromDapp } from "../types";

export const SwapSuccess = () => {
  const partner = usePartner();
  const { fromToken, toToken, fromAmount, txHash } = useSwapState((store) => {
    return {
      fromToken: store.fromToken,
      toToken: store.toToken,
      fromAmount: store.fromAmount,
      txHash: store.txHash,
    };
  });
  return (
    <StyledSuccess>
      <StyledSuccessLogo>
        <Check />
      </StyledSuccessLogo>
      <SuccessText>Swap success</SuccessText>
      <FlexRow>
        <SuccessToken token={fromToken} amount={fromAmount} />
        <StyledArrow />
        <SuccessToken token={toToken} amount="0" />
      </FlexRow>
      <StyledLink target='_blank' href={`${partner.explorerUrl}/tx/${txHash}`}>View on explorer</StyledLink>
    </StyledSuccess>
  );
};


const StyledLink = styled(Link)`
  margin-top: 20px;
`

const StyledArrow = styled(ArrowRight)`
  width: 20px;
  color: white;
  height: 20px;
`

const StyledLogo = styled(Logo)`
  width: 24px;
  height: 24px;
`

const StyledTokenText = styled(Text)`
  font-size: 15px;
`

 const SuccessToken = ({
  token,
  amount,
}: {
  token?: TokenFromDapp;
  amount?: string;
}) => {
  return (
    <FlexRow>
      <StyledLogo src={token?.logoURI} />
      <StyledTokenText>
        {amount} {token?.symbol}
      </StyledTokenText>
    </FlexRow>
  );
};

const SuccessText = styled(Text)`
  font-size: 20px;
`;

const StyledSuccess = styled(FlexColumn)`
  width: 100%;
  align-items: center;
  gap: 20px;
`;

const StyledSuccessLogo = styled(FlexRow)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #4caf50;
  align-items: center;
  justify-content: center;
  svg {
    width: 60%;
    height: 60%;
    color: white;
  }
`;
