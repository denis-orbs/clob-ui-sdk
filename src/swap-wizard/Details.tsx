import { useMemo } from "react";
import styled from "styled-components";
import { Logo } from "../components";
import { amountUi } from "../lib";
import { useSwapState } from "../store";
import { FlexColumn, FlexRow, Text } from "../styles";
import BN from "bignumber.js";
import { Token } from "../lib/types";
import { useFormatNumber } from "../hooks";

const StyledSwapDetails = styled(FlexColumn)`
  width: 100%;
  gap: 25px;
`;

const useToAmount = () => {
  const { quote, toToken } = useSwapState((store) => ({
    toToken: store.toToken,
    quote: store.quote,
  }));

  return useMemo(() => {
    if (!toToken || !quote) {
      return "0";
    }
    return amountUi(toToken!.decimals, new BN(quote.outAmount));
  }, [toToken, quote]);
};

export function SwapDetails() {
  const { fromToken, toToken, fromAmount, fromTokenUsd, toTokenUsd } =
    useSwapState();
    const toAmount = useToAmount();

  return (
    <StyledSwapDetails>
      <TokenDisplay
        title="You pay"
        usd={fromTokenUsd}
        token={fromToken}
        amount={fromAmount}
      />
      <TokenDisplay
        title="You receive"
        usd={toTokenUsd}
        token={toToken}
        amount={toAmount}
      />
    </StyledSwapDetails>
  );
}

const TokenDisplay = ({
  amount,
  token,
  usd,
  title,
}: {
  amount?: string;
  token?: Token;
  usd?: string;
  title: string;
}) => {
  if (!token) return null;

  const _amount = useFormatNumber({value: amount})
    
  return (
    <StyledTokenDisplay>
      <Title>{title}</Title>
      <FlexRow
        $justifyContent="space-between"
        $alignItems="flex-start"
        style={{ width: "100%" }}
      >
        <FlexColumn $alignItems="flex-start">
          <TokenAmount>
            {_amount} {token.symbol}
          </TokenAmount>
          {usd && <USD>${usd}</USD>}
        </FlexColumn>
        <StyledLogo src={token.logoUrl} />
      </FlexRow>
    </StyledTokenDisplay>
  );
};

const StyledLogo = styled(Logo)`
  width: 36px;
  height: 36px;
`;

const USD = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TokenAmount = styled(Text)`
  font-size: 20px;
  font-weight: 600;
`;

const Title = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StyledTokenDisplay = styled(FlexColumn)`
  align-items: flex-start;
  width: 100%;
`;
