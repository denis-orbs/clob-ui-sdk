import { useMemo } from "react";
import styled from "styled-components";
import { Logo } from "../components";
import { FlexColumn, FlexRow, Text } from "../styles";
import BN from "bignumber.js";
import { Token } from "../lib/types";
import { useFormatNumber, useSwapAmounts } from "../lib/hooks";
import { useSwapState } from "../store";

const StyledSwapDetails = styled(FlexColumn)`
  width: 100%;
  gap: 25px;
`;

export function SwapDetails() {
  const { fromToken, toToken, fromTokenUsd, toTokenUsd } = useSwapState(
    (s) => ({
      fromToken: s.fromToken,
      toToken: s.toToken,
      fromTokenUsd: s.fromTokenUsd,
      toTokenUsd: s.toTokenUsd,
    })
  );

  const { fromAmount, toAmount } = useSwapAmounts();

  return (
    <StyledSwapDetails>
      <TokenDisplay
        title="You pay"
        usd={fromTokenUsd}
        token={fromToken}
        amount={fromAmount.ui}
      />
      <TokenDisplay
        title="You receive"
        usd={toTokenUsd}
        token={toToken}
        amount={toAmount.ui}
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
  usd?: string | number;
  title: string;
}) => {
  if (!token) return null;

  const totalUsd = useMemo(() => {
    if (!usd || !amount) {
      return "0";
    }
    return new BN(usd).times(amount).toString();
  }, [usd, amount]);

  const _totalUsd = useFormatNumber({ value: totalUsd });
  const _amount = useFormatNumber({ value: amount });

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
          {_totalUsd && <USD>${_totalUsd}</USD>}
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
