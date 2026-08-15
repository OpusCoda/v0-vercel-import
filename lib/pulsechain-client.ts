// Shared viem public client for read-only PulseChain queries (getLogs, etc.).
// Separate from wagmi's wallet client — this is for background data reads that
// don't need a connected wallet.
import { createPublicClient, http, defineChain } from "viem"

export const pulsechainChain = defineChain({
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

// A single shared client instance (avoids re-creating per call).
export const publicClient = createPublicClient({
  chain: pulsechainChain,
  transport: http("https://rpc.pulsechain.com"),
})