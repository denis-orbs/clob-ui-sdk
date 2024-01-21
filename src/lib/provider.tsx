/* eslint-disable import/no-extraneous-dependencies */
import React, { createContext, ReactNode, useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setWeb3Instance } from "@defi.org/web3-candies";
import Web3 from "web3";
import { SwapWizard } from "../swap-wizard/SwapWizard";
import { ThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "./theme";
import { DEFAULT_API_ENDPOINT, DEFAULT_QUOTE_INTERVAL } from "../consts";
import { partner } from "./types";
import { Analytics, useAnalytics } from "../analytics";
const client = new QueryClient();

interface UISettings {
  buttonColor?: string;
}

interface SharedProps {
  provider?: any;
  account?: string;
  chainId?: number;
  partner: partner;
  theme?: "light" | "dark";
  apiUrl?: string;
  uiSettings?: UISettings;
  quoteInterval?: number;
  disableAnalytics?: boolean;
}

interface ContextArgs extends SharedProps {
  analytics?: Analytics;
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
}: Props) => {
  useEffect(() => {
    if (provider) {
      setWeb3Instance(new Web3(provider));
    }
  }, [provider]);

  const _theme = useMemo(() => {
    return theme === "light" ? lightTheme : darkTheme;
  }, [theme]);

  const analytics = useAnalytics(partner, chainId);

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
          analytics,
        }}
      >
        <ThemeProvider theme={_theme}>
          {children}
          <SwapWizard />
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
