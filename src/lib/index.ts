export { LiquidityHubProvider } from "./provider";
export {amountBN, amountUi} from './utils'
export * from '../components/PoweredByOrbs'
export * from "../components/OrbsLogo";
import { onDexSwapSuccess, onInitSwap, onDexSwapFailed, onDexSwapRequest } from "../analytics";
export {useLiquidityHub, useSettings, useTradeOwner,} from './swap-logic'
export { WEBSITE } from "../consts";

export const analytics = {
  onDexSwapSuccess,
  onInitSwap,
  onDexSwapFailed,
  onDexSwapRequest,
};