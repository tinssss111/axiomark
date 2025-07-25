/* eslint-disable @next/next/no-img-element */
"use client";
import React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  lightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { lisk } from "./config/chain";
import { liskSepolia } from "viem/chains";
import { AvatarComponent } from "@rainbow-me/rainbowkit";
import Blockies from "react-blockies";
import WalletConnectionHandler from "./components/WalletConnectionHandler";

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return ensImage ? (
    <img
      src={ensImage}
      width={size}
      height={size}
      alt="avatar"
      style={{ borderRadius: size }}
    />
  ) : (
    <Blockies seed={address} size={8} scale={size / 8} className="rounded" />
  );
};

const queryClient = new QueryClient();

export const wagmiConfig = getDefaultConfig({
  appName: "AxioMark DApp",
  projectId: "YOUR_PROJECT_ID",
  chains: [lisk, liskSepolia],
  ssr: true,
});

function App({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={CustomAvatar}
          theme={lightTheme({
            accentColor: "#1249D8",
            accentColorForeground: "white",
            borderRadius: "small",
            fontStack: "rounded",
            overlayBlur: "none",
          })}
        >
          <WalletConnectionHandler>{children}</WalletConnectionHandler>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
