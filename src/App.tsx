
import { LiquidityHubProvider } from "./lib/providers";
import "reactjs-popup/dist/index.css";
import { useSwapState } from "./store";

const Buttons = () => {
const updateState = useSwapState((s) => s.updateState);
    
  return <button onClick={() => updateState({
    showWizard: true
  })}>Swap</button>;
};

function app() {
  return (
    <LiquidityHubProvider theme="dark" partner='quickswap' chainId={137} slippage={0.5}>
      <Buttons />
    </LiquidityHubProvider>
  );
}

export default app;
