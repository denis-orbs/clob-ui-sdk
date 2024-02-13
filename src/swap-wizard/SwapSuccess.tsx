import { Check, ArrowRight } from "react-feather";
import styled from "styled-components";
import { Logo } from "../components";
import { useSwapState } from "../store";
import { FlexRow, FlexColumn, Text, Link } from "../styles";
import { Token } from "../lib/types";
import { useChainConfig, useFormatNumber, useSwapAmounts } from "../lib/hooks";

export const SwapSuccess = () => {
  const txHash = useSwapState((store) => store.txHash);
  const { fromAmount, toAmount } = useSwapAmounts();
  const { fromToken, toToken } = useSwapState((store) => ({
    fromToken: store.fromToken,
    toToken: store.toToken,
  }));
  const explorerUrl = useChainConfig()?.explorerUrl;
  const _fromAmount = useFormatNumber({value: fromAmount.ui});
  const _toAmount = useFormatNumber({ value: toAmount.ui });
  return (
    <StyledSuccess>
      <StyledSuccessLogo>
        <Check />
      </StyledSuccessLogo>
      <SuccessText>Swap success</SuccessText>
      <FlexRow>
        <SuccessToken token={fromToken} amount={_fromAmount} />
        <StyledArrow />
        <SuccessToken token={toToken} amount={_toAmount} />
      </FlexRow>
      <StyledLink target="_blank" href={`${explorerUrl}/tx/${txHash}`}>
        View on explorer
      </StyledLink>
    </StyledSuccess>
  );
};

const StyledLink = styled(Link)`
  margin-top: 20px;
`;

const StyledArrow = styled(ArrowRight)`
  width: 20px;
  color: white;
  height: 20px;
`;

const StyledLogo = styled(Logo)`
  width: 24px;
  height: 24px;
`;

const StyledTokenText = styled(Text)`
  font-size: 15px;
`;

const SuccessToken = ({
  token,
  amount,
}: {
  token?: Token;
  amount?: string;
}) => {
  return (
    <FlexRow>
      <StyledLogo src={token?.logoUrl} />
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
