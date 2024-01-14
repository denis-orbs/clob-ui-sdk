import { mockSwap } from "./mock";
import { LiquidityHubProvider } from "./lib/providers";
import "reactjs-popup/dist/index.css";
import { useLiquidityHub } from "./lib";

const Buttons = () => {
const { swapCallback } = useLiquidityHub({
  fromToken: mockSwap.fromToken,
  toToken: mockSwap.toToken,
  fromAmount: mockSwap.fromAmount,
  fromTokenUsd: mockSwap.fromTokenUsd,
  toTokenUsd: mockSwap.toTokenUsd,
});
    
  return <button onClick={() => swapCallback({})}>Swap</button>;
};

function app() {
  return (
    <LiquidityHubProvider theme="dark" partner='quickswap' chainId={137} slippage={0.5}>
      <Buttons />
    </LiquidityHubProvider>
  );
}

export default app;
