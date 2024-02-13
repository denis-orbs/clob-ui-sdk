/* eslint-disable import/no-extraneous-dependencies */
import React, { createContext, ReactNode, useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setWeb3Instance } from "@defi.org/web3-candies";
import Web3 from "web3";
import { SwapWizard } from "./swap-wizard/SwapWizard";
import { ThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "./theme";
import { DEFAULT_API_ENDPOINT, DEFAULT_QUOTE_INTERVAL } from "./consts";
import { swapAnalytics } from "./analytics";
const client = new QueryClient();

interface UISettings {
  buttonColor?: string;
}

interface SharedProps {
  provider?: any;
  account?: string;
  chainId?: number;
  partner: string;
  theme?: "light" | "dark";
  apiUrl?: string;
  uiSettings?: UISettings;
  quoteInterval?: number;
  disableAnalytics?: boolean;
  customSubmitSwapModal?: ReactNode;
}

interface ContextArgs extends SharedProps {
  web3?: Web3;
}

const Context = createContext({} as ContextArgs);

interface Props extends SharedProps {
  children: ReactNode;
}

export const LiquidityHubProvider = ({
  children,
  provider,
  account,
  chainId,
  partner,
  uiSettings,
  theme,
  quoteInterval = DEFAULT_QUOTE_INTERVAL,
  apiUrl = DEFAULT_API_ENDPOINT,
  customSubmitSwapModal,
}: Props) => {
  const web3 = useMemo(
    () => (provider ? new Web3(provider) : undefined),
    [provider]
  );

  useEffect(() => {
    if (web3) {
      setWeb3Instance(web3);
    } else {
      setWeb3Instance(undefined);
    }
  }, [web3]);

  const _theme = useMemo(() => {
    return theme === "light" ? lightTheme : darkTheme;
  }, [theme]);

  useEffect(() => {
    if (chainId && partner) {
      swapAnalytics.setChainId(chainId);
      swapAnalytics.setPartner(partner);
    }
  }, [chainId, partner]);

  return (
    <QueryClientProvider client={client}>
      <Context.Provider
        value={{
          provider,
          account,
          chainId,
          partner,
          uiSettings,
          theme,
          quoteInterval,
          apiUrl,
          web3,
        }}
      >
        <ThemeProvider theme={_theme}>
          {children}
          {!customSubmitSwapModal && <SwapWizard />}
        </ThemeProvider>
      </Context.Provider>
    </QueryClientProvider>
  );
};

export const useLHContext = () => {
  const context = React.useContext(Context);
  if (!context) {
    throw new Error("useLHContext must be used within a LHProvider");
  }
  return context;
};
