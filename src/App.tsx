import { mockSwap } from "./mock";
import { LiquidityHubProvider } from "./lib/providers";
import { useSwapState } from "./store";
import "reactjs-popup/dist/index.css";

const Buttons = () => {
const { initSwap } = useSwapState();
    
  const onClick = () => {
    initSwap({
      fromToken: mockSwap.fromToken,
      toToken: mockSwap.toToken,
      fromAmount: mockSwap.fromAmount,
      fromTokenUsd: mockSwap.fromTokenUsd,
      toTokenUsd: mockSwap.toTokenUsd,
    });
  }
  return <button onClick={onClick}>Swap</button>;
};

function app() {
  return (
    <LiquidityHubProvider theme="dark" partner='thena' chainId={56} slippage={0.5}>
      <Buttons />
    </LiquidityHubProvider>
  );
}

export default app;
