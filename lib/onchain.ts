import { ethers } from "ethers"

// ── Contract addresses ──────────────────────────────────────────────
export const OPUS_CONTRACT = "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a"
export const CODA_CONTRACT = "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28"
export const SMAUG_ADDRESS = "0xf4754Aa585caBf38537A68660469A17E203D8632"
export const PWBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
export const FINVESTA_ADDRESS = "0x1C81b4358246d3088Ab4361aB755F3D8D4dd62d2"
export const MISSOR_ADDRESS = "0x063E79CF6A555dac9033EAa3c61A8f02F1020759"
export const WGPP_ADDRESS = "0x770CFA2FB975E7bCAEDDe234D92c3858C517Adca"

export const SMAUG_VAULT_ADDRESS = "0xD1fB678aB14429140c06AfFFCC878F9c41F48787"
export const SMAUG_HOARD_ADDRESS = "0x1FEe39A78Bd2cf20C11B99Bd1dF08d5b2fCc0b9a"
export const GAS_MONEY_ADDRESS = "0x042b48a98B37042D58Bc8defEEB7cA4eC76E6106"
export const DOMINANCE_ADDRESS = "0x116D162d729E27E2E1D6478F1d2A8AEd9C7a2beA"
export const BURN_ADDRESS = "0x0000000000000000000000000000000000000369"

// Coda distributor contracts (v1, v2, v3)
export const CODA_DISTRIBUTORS = [
  "0xD9857f41E67812dbDFfdD3269B550836EC131D0C",
  "0x502E10403E20D6Ff42CBBDa7fdDC4e1315Da19AF",
  "0x2924Dc56bb4eeF50d0d32D8aCD6AA7c61aFa5dfe",
]

// ── ABIs ────────────────────────────────────────────────────────────
export const OPUS_ABI = [
  "function getTotalPlsEarned(address) view returns (uint256)",
  "function getTotalPlsDistributed() view returns (uint256)",
]
export const DISTRIBUTOR_ABI = [
  "function totalWethDistributed() view returns (uint256)",
  "function totalWbtcDistributed() view returns (uint256)",
  "function totalPlsxDistributed() view returns (uint256)",
]
export const SMAUG_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalBurned() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event LPAdded(uint256 plsAmount, uint256 tokenAmount)",
]
export const BALANCE_ABI = ["function balanceOf(address) view returns (uint256)"]

// ── Shared provider (singleton) ─────────────────────────────────────
let _provider: ethers.JsonRpcProvider | null = null
export function getProvider() {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!)
  }
  return _provider
}

// Retry RPC calls with a timeout
export async function rpcRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 2000): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("RPC timeout")), 20000),
      )
      return await Promise.race([fn(), timeoutPromise])
    } catch (err) {
      if (i === retries) throw err
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
    }
  }
  throw new Error("rpcRetry exhausted")
}

// ── Formatters ──────────────────────────────────────────────────────
export const formatWithCommas = (v: string | number, decimals = 0) => {
  const str = typeof v === "string" ? v : v.toString()
  const [i, d = ""] = str.split(".")
  const withCommas = i.length >= 5 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : i
  return decimals > 0 ? `${withCommas}.${d.padEnd(decimals, "0").slice(0, decimals)}` : withCommas
}

export const formatMillions = (v: string | number, decimals = 1) => {
  const num = typeof v === "string" ? Number.parseFloat(v) : v
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`
  return formatWithCommas(v)
}

export const formatBillions = (v: string | number, decimals = 2) => {
  const num = typeof v === "string" ? Number.parseFloat(v) : v
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(decimals)}B`
  return formatMillions(v, decimals)
}
