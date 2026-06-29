"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
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

export const wagmiConfig = getDefaultConfig({
  appName: "OpusEco",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [pulsechain],
  ssr: true,
})
