"use client"

import { connectorsForWallets, type Wallet } from "@rainbow-me/rainbowkit"
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  injectedWallet,
  trustWallet,
  argentWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { createConfig, createConnector, http } from "wagmi"
import { injected } from "wagmi/connectors"
import { defineChain } from "viem"

export const pulsechain = defineChain({
  id: 369,
  name: "PulseChain",
  nativeCurrency: { name: "Pulse", symbol: "PLS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.pulsechain.com"] },
  },
  blockExplorers: {
    default: { name: "PulseScan", url: "https://scan.pulsechain.com" },
  },
})

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""

// Locate the Internet Money injected provider (browser extension on PulseChain).
function getInternetMoneyProvider() {
  if (typeof window === "undefined") return undefined
  const w = window as unknown as {
    internetMoney?: unknown
    ethereum?: { isInternetMoney?: boolean; providers?: { isInternetMoney?: boolean }[] }
  }
  if (w.internetMoney) return w.internetMoney
  const eth = w.ethereum
  if (eth?.isInternetMoney) return eth
  const nested = eth?.providers?.find((p) => p?.isInternetMoney)
  return nested ?? undefined
}

// Custom Internet Money wallet. Connects via its injected provider when the
// extension is installed and otherwise shows the download flow.
const internetMoneyWallet = (): Wallet => ({
  id: "internetMoney",
  name: "Internet Money",
  iconUrl: "/wallets/internet-money.png",
  iconBackground: "#0a0a0c",
  installed: typeof window !== "undefined" ? !!getInternetMoneyProvider() || undefined : undefined,
  downloadUrls: {
    browserExtension: "https://internetmoney.io",
    android: "https://play.google.com/store/apps/details?id=io.internetmoney",
    ios: "https://apps.apple.com/app/internet-money-wallet/id1640527610",
    qrCode: "https://internetmoney.io",
  },
  createConnector: (walletDetails) =>
    createConnector((config) => ({
      ...injected({
        target: () => ({
          id: walletDetails.rkDetails.id,
          name: walletDetails.rkDetails.name,
          provider: getInternetMoneyProvider() as never,
        }),
      })(config),
      ...walletDetails,
    })),
})

// Locate the Brave Wallet injected provider.
function getBraveProvider() {
  if (typeof window === "undefined") return undefined
  const w = window as unknown as {
    ethereum?: { isBraveWallet?: boolean; providers?: { isBraveWallet?: boolean }[] }
  }
  const eth = w.ethereum
  if (eth?.isBraveWallet) return eth
  const nested = eth?.providers?.find((p) => p?.isBraveWallet)
  return nested ?? undefined
}

// Custom Brave Wallet that always appears (the built-in connector self-hides
// when not running in the Brave browser).
const braveWalletAlways = (): Wallet => ({
  id: "brave",
  name: "Brave Wallet",
  iconUrl: "/wallets/brave.png",
  iconBackground: "#fff",
  installed: typeof window !== "undefined" ? !!getBraveProvider() || undefined : undefined,
  downloadUrls: {
    browserExtension: "https://brave.com/wallet/",
  },
  createConnector: (walletDetails) =>
    createConnector((config) => ({
      ...injected({
        target: () => ({
          id: walletDetails.rkDetails.id,
          name: walletDetails.rkDetails.name,
          provider: getBraveProvider() as never,
        }),
      })(config),
      ...walletDetails,
    })),
})

// Locate the ZKX Wallet injected provider.
function getZkxProvider() {
  if (typeof window === "undefined") return undefined
  const w = window as unknown as {
    zkx?: unknown
    ethereum?: { isZKX?: boolean; isZkx?: boolean; providers?: { isZKX?: boolean; isZkx?: boolean }[] }
  }
  if (w.zkx) return w.zkx
  const eth = w.ethereum
  if (eth?.isZKX || eth?.isZkx) return eth
  const nested = eth?.providers?.find((p) => p?.isZKX || p?.isZkx)
  return nested ?? undefined
}

// Custom ZKX Wallet that always appears as a default option. Connects via its
// injected provider when the extension is installed, otherwise shows download.
const zkxWallet = (): Wallet => ({
  id: "zkx",
  name: "ZKX Wallet",
  iconUrl: "/wallets/zkx.png",
  iconBackground: "#000",
  installed: typeof window !== "undefined" ? !!getZkxProvider() || undefined : undefined,
  downloadUrls: {
    browserExtension: "https://zkx.io",
  },
  createConnector: (walletDetails) =>
    createConnector((config) => ({
      ...injected({
        target: () => ({
          id: walletDetails.rkDetails.id,
          name: walletDetails.rkDetails.name,
          provider: getZkxProvider() as never,
        }),
      })(config),
      ...walletDetails,
    })),
})

const connectors = connectorsForWallets(
  [
    {
      groupName: "Official",
      wallets: [internetMoneyWallet, braveWalletAlways, zkxWallet],
    },
    {
      groupName: "Popular",
      wallets: [injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet],
    },
    {
      groupName: "More",
      wallets: [argentWallet, trustWallet],
    },
  ],
  { appName: "OpusEco", projectId },
)

export const wagmiConfig = createConfig({
  connectors,
  chains: [pulsechain],
  transports: { [pulsechain.id]: http("https://rpc.pulsechain.com") },
  ssr: true,
})
