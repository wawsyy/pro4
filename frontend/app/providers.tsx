"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";

const chains = [hardhat, sepolia] as const;
const transports = {
  [hardhat.id]: http("http://localhost:8545"),
  [sepolia.id]: http(),
} as const;

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = walletConnectProjectId
  ? [
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: true,
        metadata: {
          name: "Encrypted Survey System",
          description: "Encrypted survey MVP powered by Zama FHEVM",
          url: "https://zama.ai",
          icons: ["https://zama.ai/zama-logo.svg"],
        },
      }),
      injected({ shimDisconnect: true }),
    ]
  : [injected({ shimDisconnect: true })];

const wagmiConfig = createConfig({
  chains,
  connectors,
  transports,
  ssr: true,
});

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (!walletConnectProjectId) {
      console.warn(
        "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID 未设置，已退回仅注入式钱包（如 MetaMask）。若需 WalletConnect，请前往 https://cloud.walletconnect.com 创建项目并更新环境变量。",
      );
    }
  }, []);

  const theme = useMemo(
    () =>
      darkTheme({
        accentColor: "#6366f1",
      }),
    [],
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" theme={theme} initialChain={hardhat}>
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
