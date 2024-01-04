/* eslint-disable import/no-extraneous-dependencies */
import React, { createContext, ReactNode, useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAnalytics } from "../analytics";
import { setWeb3Instance } from "@defi.org/web3-candies";
import Web3 from "web3";
import { SwapWizard } from "../swap-wizard/SwapWizard";
import { useQuerySettings } from "../hooks";
import { ThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "./theme";
import { partner } from "./types";
const client = new QueryClient();

interface Settings {
  quoteInterval?: number;
}

interface SharedProps {
  provider?: any;
  account?: string;
  chainId?: number;
  partner: partner;
  slippage?: number;
  location?: Location;
  settings?: Settings;
  theme?: "light" | "dark";
}
const Context = createContext({} as SharedProps);

interface Props extends SharedProps {
  children: ReactNode;
}

export const LiquidityHubProvider = ({
  children,
  provider,
  account,
  chainId,
  partner,
  slippage,
  location,
  settings,
  theme,
}: Props) => {
  useAnalytics(partner, chainId);
  useQuerySettings(location);

  useEffect(() => {
    if (provider){
       setWeb3Instance(new Web3(provider));
    }
  }, [provider]);

  const _theme = useMemo(() => {
    return theme === "light" ? lightTheme : darkTheme;
  }, [theme]);

  return (
    <QueryClientProvider client={client}>
      <Context.Provider
        value={{
          provider,
          account,
          chainId,
          partner,
          slippage,
          settings,
          theme,
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
