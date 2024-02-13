
import { LiquidityHubProvider } from "./lib/provider";
import "reactjs-popup/dist/index.css";
import { useSwapState } from "./store";
import { useOrders } from "./lib/hooks";

const Buttons = () => {
const updateState = useSwapState((s) => s.updateState);
    
  return <button onClick={() => updateState({
    showWizard: true
  })}>Swap</button>;
};

function app() {
  return (
    <LiquidityHubProvider
      account="0x50015A452E644F5511fbeeac6B2aD2bf154E40E4"
      theme="dark"
      partner="quickswap"
      chainId={137}
      provider={(window as any).ethereum}
    >
      <Orders />
      <Buttons />
    </LiquidityHubProvider>
  );
}


const Orders = () => {
  const data = useOrders();
  console.log({ data });
  
  return null
}

export default app;
