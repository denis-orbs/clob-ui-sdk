import { Check, ArrowRight } from "react-feather";
import styled from "styled-components";
import { Logo } from "../components";
import { useFormatNumber, usePartner } from "../hooks";
import { amountUi } from "../lib";
import { useSwapState } from "../store";
import { FlexRow, FlexColumn, Text, Link } from "../styles";
import BN from "bignumber.js";
import { useMemo } from "react";
import { Token } from "../lib/types";

export const SwapSuccess = () => {
  const partner = usePartner();
  const { fromToken, toToken, fromAmount, txHash, quote } = useSwapState(
    (store) => {
      return {
        fromToken: store.fromToken,
        toToken: store.toToken,
        fromAmount: store.fromAmount,
        txHash: store.txHash,
        quote: store.quote,
      };
    }
  );

  const toAmountRaw = useMemo(() => {
    if (!toToken || !quote) {
      return "0";
    }
    return amountUi(toToken!, new BN(quote.outAmount));
  }, [toToken, quote]);

  const toAmount = useFormatNumber({
    value: toAmountRaw,
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
        <SuccessToken token={toToken} amount={toAmount} />
      </FlexRow>
      <StyledLink target="_blank" href={`${partner.explorerUrl}/tx/${txHash}`}>
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
