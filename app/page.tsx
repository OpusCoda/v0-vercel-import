"use client"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { ethers } from "ethers"
import Image from "next/image"
import { ChevronDown } from "lucide-react"

const formatDecimals = (v: string, decimals = 0) => {
  const [i, d = ""] = v.split(".")
  return decimals > 0 ? `${i}.${d.padEnd(decimals, "0").slice(0, decimals)}` : i
}

const formatWithCommas = (v: string, decimals = 0) => {
  const [i, d = ""] = v.split(".")
  // Only add commas if the integer part has 5 or more digits
  const withCommas = i.length >= 5 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : i
  return decimals > 0 ? `${withCommas}.${d.padEnd(decimals, "0").slice(0, decimals)}` : withCommas
}

const formatMillions = (v: string | number, decimals = 1) => {
  const num = typeof v === "string" ? Number.parseFloat(v) : v
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`
  }
  return formatWithCommas(typeof v === "string" ? v : v.toString())
}

const formatBillions = (v: string | number, decimals = 2) => {
  const num = typeof v === "string" ? Number.parseFloat(v) : v
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(decimals)}B`
  }
  return formatMillions(v, decimals)
}

const OPUS_CONTRACT = "0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
const CODA_CONTRACT = "0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
const OPUS_V1_CONTRACT = "0x7251d2965f165fCE18Ae5fC4c4979e01b46057d7"
const OPUS_V2_CONTRACT = "0x90501f0C51c3aaDc76c9b27E501b68Db153Dcc81"
const CODA_V1_CONTRACT = "0xD9857f41E67812dbDFfdD3269B550836EC131D0C"
const CODA_V2_CONTRACT = "0x502E10403E20D6Ff42CBBDa7fdDC4e1315Da19AF"

const OPUS_ABI = [
  "function getTotalMissorEarned(address) view returns (uint256)", // 0x6887e0b3
  "function getTotalFinvestaEarned(address) view returns (uint256)", // 0x94a17cf0
  "function getTotalWgppEarned(address) view returns (uint256)", // 0xc3aff3e3
]
const CODA_ABI = [
  "function getTotalWethEarned(address) view returns (uint256)", // 0xcdaaa4f0
  "function getTotalWbtcEarned(address) view returns (uint256)", // 0x2eb2c229
  "function getTotalPlsxEarned(address) view returns (uint256)", // 0x442b1c12
]

const SHARES_ABI = [
  "function shares(address) view returns (uint256 amount, uint256 missorTotalExcluded, uint256 missorTotalRealised, uint256 finvestaTotalExcluded, uint256 finvestaTotalRealised, uint256 wgppTotalExcluded, uint256 wgppTotalRealised)", // 0xce7c2ac2 for Opus
]

const CODA_SHARES_ABI = [
  "function shares(address) view returns (uint256 amount, uint256 wethTotalExcluded, uint256 wethTotalRealised, uint256 wbtcTotalExcluded, uint256 wbtcTotalRealised, uint256 plsTotalExcluded, uint256 plsTotalRealised)", // 0xce7c2ac2 for Coda
]

const DISTRIBUTOR_ABI = [
  "function totalMissorDistributed() view returns (uint256)",
  "function totalFinvestaDistributed() view returns (uint256)",
  "function totalWgppDistributed() view returns (uint256)",
  "function totalWethDistributed() view returns (uint256)",
  "function totalWbtcDistributed() view returns (uint256)",
  "function totalPlsxDistributed() view returns (uint256)",
]

const SMAUG_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalBurned() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event LPAdded(uint256 plsAmount, uint256 tokenAmount)",
]

const BALANCE_ABI = ["function balanceOf(address) view returns (uint256)"] // 0x70a08231

const HEX_PULSECHAIN_ADDRESS = "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39"
const HEX_ETHEREUM_ADDRESS = "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39"

const HEX_STAKING_ABI = [
  "function stakeCount(address) view returns (uint256)",
  "function stakeLists(address, uint256) view returns (uint40 stakeId, uint72 stakedHearts, uint72 stakeShares, uint16 lockedDay, uint16 stakedDays, uint16 unlockedDay, bool isAutoStake)",
  "function currentDay() view returns (uint256)",
]

const HSI_MANAGER_ABI = [
  "function stakeCount(address) view returns (uint256)",
  "function stakeLists(address, uint256) view returns (uint40 stakeId, uint72 stakedHearts, uint72 stakeShares, uint16 lockedDay, uint16 stakedDays, uint16 unlockedDay, bool isAutoStake)",
]

const HSI_MANAGER_ADDRESS = "0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3"
const HSI_MANAGER_ETHEREUM_ADDRESS = "0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3"

const ETHEREUM_RPC_URL = "https://ethereum.publicnode.com"
const ETHEREUM_TIMEOUT = 20000

// Liquid Loans contract
const LIQUID_LOANS_VAULT_MANAGER = "0xD79bfb86fA06e8782b401bC0197d92563602D2Ab"
const LIQUID_LOANS_ABI = [
  "function getVaultColl(address) view returns (uint256)",
  "function getVaultDebt(address) view returns (uint256)",
]

// Token addresses for balance display
const PLSX_ADDRESS = "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab"
const INC_ADDRESS = "0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d"
const EHEX_FROM_ETHEREUM_ADDRESS = "0x57fde0a71132198BBeC939B98976993d8D89D225" // eHEX bridged to Pulsechain
const PWBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" // WBTC on Pulsechain
const SMAUG_ADDRESS = "0xf4754Aa585caBf38537A68660469A17E203D8632"

export default function Home() {
  const [rewards, setRewards] = useState<
    Array<{
      address: string
      opus: { missor: string; finvesta: string; wgpp: string }
      coda: { weth: string; Pwbtc: string; plsx: string }
      holdings: { opus: string; coda: string }
    }>
  >([])
  const [walletAddresses, setWalletAddresses] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [walletRewards, setWalletRewards] = useState<{
    opus: { missor: string; finvesta: string; wgpp: string }
    coda: { weth: string; Pwbtc: string; plsx: string }
  } | null>(null)
  const [error, setError] = useState("")
  const [smaugLpAddedData, setSmaugLpAddedData] = useState<{
  totalPLS: string
} | null>(null)
  const [totalRewards, setTotalRewards] = useState<{
    opus: { missor: string; finvesta: string; wgpp: string }
    coda: { weth: string; Pwbtc: string; plsx: string }
  } | null>(null)
  const [tokenPrices, setTokenPrices] = useState<{
    missor: number
    finvesta: number
    wgpp: number
    weth: number
    Pwbtc: number
    plsx: number
    opus: number
    coda: number
  }>({
    missor: 0,
    finvesta: 0,
    wgpp: 0,
    weth: 0,
    Pwbtc: 0,
    plsx: 0,
    opus: 0,
    coda: 0,
  })
  const [savedName, setSavedName] = useState("")
  const [loadName, setLoadName] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [totalDistributed, setTotalDistributed] = useState<{
    missor: string
    finvesta: string
    wgpp: string
    weth: string
    Pwbtc: string
    plsx: string
  } | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState("")

  const [hexStakes, setHexStakes] = useState<any[]>([])
  const [hsiStakes, setHsiStakes] = useState<any[]>([])
  const [hexPricePulsechain, setHexPricePulsechain] = useState(0)
  const [hexPriceEthereum, setHexPriceEthereum] = useState(0)
  const [tokenBalances, setTokenBalances] = useState<{
    pls: number
    plsx: number
    inc: number
    pHex: number
    eHexFromEthereum: number
    eHex: number
    pWbtc: number
    smaug: number
  }>({ pls: 0, plsx: 0, inc: 0, pHex: 0, eHexFromEthereum: 0, eHex: 0, pWbtc: 0, smaug: 0 })
  const [tokenPricesAll, setTokenPricesAll] = useState<{
    pls: number
    plsx: number
    inc: number
    pHex: number
    eHex: number
    wbtc: number
  }>({ pls: 0, plsx: 0, inc: 0, pHex: 0, eHex: 0, wbtc: 0 })
  const [liquidLoansVaults, setLiquidLoansVaults] = useState<Array<{
    wallet: string
    lockedPLS: number
    debt: number
  }>>([])
  const [expandedStakeCards, setExpandedStakeCards] = useState<Set<string>>(new Set())
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [smaugVaultPLS, setSmaugVaultPLS] = useState(0)
  const [smaugPrice, setSmaugPrice] = useState(0)
  const [plsPrice, setPlsPrice] = useState(0)
  const [smaugTotalBurned, setSmaugTotalBurned] = useState(0)
  const [smaugMarketCap, setSmaugMarketCap] = useState(0)
  const [smaugLiquidity, setSmaugLiquidity] = useState(0)
  const [smaugVaultBurned, setSmaugVaultBurned] = useState(0)
  const [smaugHoardBurned, setSmaugHoardBurned] = useState(0)
  const [hoardData, setHoardData] = useState<{
    pls: number
    pWbtc: number
    pWbtcPrice: number
    gasMoney: number
    gasMoneyPrice: number
    dominance: number
    dominancePrice: number
  }>({ pls: 0, pWbtc: 0, pWbtcPrice: 0, gasMoney: 0, gasMoneyPrice: 0, dominance: 0, dominancePrice: 0 })

  const toggleStakeCard = (cardId: string) => {
    setExpandedStakeCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const fetchSmaugLPEvents = async () => {
  try {
    console.log("[v0] Fetching Smaug LP added events...")
    const provider = getProvider()
    
    const smaugContract = new ethers.Contract(SMAUG_ADDRESS, SMAUG_ABI, provider)
    const lpFilter = smaugContract.filters.LPAdded()
    const lpEvents = await rpcRetry(() => smaugContract.queryFilter(lpFilter, 0, 'latest'), 2, 3000)
    
    let totalPLS = 0n
    for (const event of lpEvents) {
      const log = event as ethers.EventLog
      totalPLS += BigInt(log.args[1])   // amountPLS is second
    }
    
    setSmaugLpAddedData({
      totalPLS: ethers.formatUnits(totalPLS, 18),
    })
    
    console.log("[v0] Smaug LP events fetched (PLS only)")
  } catch (error) {
    console.error("[v0] Failed to fetch Smaug LP events:", error)
  }
}

  const [expandedWallets, setExpandedWallets] = useState<Set<number>>(new Set())

  const toggleWallet = (index: number) => {
    setExpandedWallets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const [liquidityData, setLiquidityData] = useState<{
    opus: { opusAdded: string; plsAdded: string } | null
    coda: { codaAdded: string; plsAdded: string } | null
  }>({ opus: null, coda: null })

  useEffect(() => {
    // Fetch saved lists from database here if needed
  }, [])

  // Single shared RPC provider to avoid multiple competing connections
  const providerRef = useRef<ethers.JsonRpcProvider | null>(null)
  const getProvider = () => {
    if (!providerRef.current) {
      providerRef.current = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!)
    }
    return providerRef.current
  }

  // Helper to retry RPC calls with timeout
  const rpcRetry = async <T,>(fn: () => Promise<T>, retries = 1, delayMs = 2000): Promise<T> => {
    for (let i = 0; i <= retries; i++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("RPC timeout")), 15000)
        )
        return await Promise.race([fn(), timeoutPromise])
      } catch (err) {
        if (i === retries) throw err
        await new Promise(r => setTimeout(r, delayMs * (i + 1)))
      }
    }
    throw new Error("rpcRetry exhausted")
  }

  const fetchLiquidityData = async () => {
    try {
      console.log("[v0] Fetching liquidity data...")
      const provider = getProvider()

      const [opusLpAddedData, opusPlsLpAddedData, codaLpAddedData, codaPlsLpAddedData] = await Promise.all([
        rpcRetry(() => provider.call({ to: OPUS_CONTRACT, data: "0x77e34bcf" })),
        rpcRetry(() => provider.call({ to: OPUS_CONTRACT, data: "0x2f6ec43a" })),
        rpcRetry(() => provider.call({ to: CODA_CONTRACT, data: "0x2af2db78" })),
        rpcRetry(() => provider.call({ to: CODA_CONTRACT, data: "0x2f6ec43a" })),
      ])

      // Baseline PLS for Opus liquidity (pre-tracking amounts)
      const opusPlsBaseline1 = BigInt("49666029536348406754405890")
      const opusPlsBaseline2 = BigInt("17938960181623487006781877")
      const totalOpusPls = BigInt(opusPlsLpAddedData) + opusPlsBaseline1 + opusPlsBaseline2

      // Baseline PLS for Coda liquidity (pre-tracking amounts)
      const codaPlsBaseline1 = BigInt("39551834742159002925770986")
      const codaPlsBaseline2 = BigInt("16191801870025447450804067")
      const totalCodaPls = BigInt(codaPlsLpAddedData) + codaPlsBaseline1 + codaPlsBaseline2

      setLiquidityData({
        opus: {
          opusAdded: ethers.formatUnits(opusLpAddedData, 18),
          plsAdded: ethers.formatUnits(totalOpusPls.toString(), 18),
        },
        coda: {
          codaAdded: ethers.formatUnits(codaLpAddedData, 18),
          plsAdded: ethers.formatUnits(totalCodaPls.toString(), 18),
        },
      })
      console.log("[v0] Liquidity data fetched")
    } catch (error) {
      console.error("[v0] Failed to fetch liquidity data:", error)
    }
  }

  // Cached prices ref so dependent functions can access them
  const cachedPricesRef = useRef<any>(null)

  const fetchCachedPrices = async () => {
    try {
      const res = await fetch("/api/prices")
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      cachedPricesRef.current = data
      return data
    } catch (err) {
      console.error("[v0] Error fetching cached prices:", err)
      return null
    }
  }

  useEffect(() => {
    const init = async () => {
      // Step 1: Fetch all DexScreener prices from server cache (1 request)
      console.log("[v0] Fetching cached prices from /api/prices...")
      const prices = await fetchCachedPrices()
      console.log("[v0] Cached prices result:", prices ? "success" : "failed", prices ? `smaug=${prices.smaug}, pls=${prices.pls}, missor=${prices.missor}` : "")
      applyTokenPrices(prices)
      
      // Step 2: Run RPC-dependent fetches sequentially to avoid overwhelming the PulseChain RPC
      // Each function handles its own errors so one failing won't block the next
      try { await fetchSmaugVaultData(prices) } catch {}
      try { await fetchSmaugLPEvents() } catch {}
      try { await fetchTotalDistributed() } catch {}
      try { await fetchLiquidityData() } catch {}
    }
    init()
  }, [])

  const applyTokenPrices = (prices: any) => {
    if (!prices) return
    setTokenPrices({
      missor: prices.missor || 0,
      finvesta: prices.finvesta || 0,
      wgpp: prices.wgpp || 0,
      weth: prices.weth || 0,
      Pwbtc: prices.pwbtc || 0,
      plsx: prices.plsx || 0,
      opus: prices.opus || 0,
      coda: prices.coda || 0,
    })
  }

  const fetchSmaugVaultData = async (prices?: any) => {
    console.log("[v0] Starting fetchSmaugVaultData...")
    const p = prices || cachedPricesRef.current
    
    // Set cached prices immediately (no RPC needed)
    if (p) {
      setPlsPrice(p.pls || 0)
      setSmaugPrice(p.smaug || 0)
      setSmaugMarketCap(p.smaugMarketCap || 0)
      setSmaugLiquidity(p.smaugLiquidity || 0)
    }

    const provider = getProvider()
    const smaugContract = new ethers.Contract(SMAUG_ADDRESS, SMAUG_ABI, provider)

    // Batch 1: Simple balance reads (light RPC calls)
    try {
      const [vaultBalance, hoardPlsBalance] = await Promise.all([
        rpcRetry(() => provider.getBalance("0xD1fB678aB14429140c06AfFFCC878F9c41F48787")),
        rpcRetry(() => provider.getBalance("0x1FEe39A78Bd2cf20C11B99Bd1dF08d5b2fCc0b9a")),
      ])
      setSmaugVaultPLS(Number(ethers.formatEther(vaultBalance)))
      
      // Also fetch hoard token balances
      const gasMoneyContract = new ethers.Contract("0x042b48a98B37042D58Bc8defEEB7cA4eC76E6106", BALANCE_ABI, provider)
      const dominanceContract = new ethers.Contract("0x116D162d729E27E2E1D6478F1d2A8AEd9C7a2beA", BALANCE_ABI, provider)
      const pWbtcContract = new ethers.Contract(PWBTC_ADDRESS, BALANCE_ABI, provider)
      const hoardAddress = "0x1FEe39A78Bd2cf20C11B99Bd1dF08d5b2fCc0b9a"
      
      const [gasMoneyBal, dominanceBal, pWbtcBal] = await Promise.all([
        rpcRetry(() => gasMoneyContract.balanceOf(hoardAddress)),
        rpcRetry(() => dominanceContract.balanceOf(hoardAddress)),
        rpcRetry(() => pWbtcContract.balanceOf(hoardAddress)),
      ])

      setHoardData({
        pls: Number(ethers.formatEther(hoardPlsBalance)),
        pWbtc: Number(ethers.formatUnits(pWbtcBal, 8)),
        pWbtcPrice: p?.pwbtc || 0,
        gasMoney: Number(ethers.formatEther(gasMoneyBal)),
        gasMoneyPrice: p?.gasMoney || 0,
        dominance: Number(ethers.formatEther(dominanceBal)),
        dominancePrice: p?.dominance || 0,
      })
      console.log("[v0] Vault + hoard balances fetched")
    } catch (err) {
      console.error("[v0] Error fetching vault/hoard balances:", err)
    }

    // Small delay to let RPC recover
    await new Promise(r => setTimeout(r, 1000))

    // Batch 2: Contract reads (totalBurned)
    try {
      let burned
      try {
        burned = await rpcRetry(() => smaugContract.totalBurned())
      } catch {
        burned = await rpcRetry(() => smaugContract.balanceOf("0x0000000000000000000000000000000000000369"))
      }
      setSmaugTotalBurned(Number(ethers.formatEther(burned)))
      console.log("[v0] Total burned fetched")
    } catch (err) {
      console.error("[v0] Error fetching total burned:", err)
    }

    // Small delay before heavy event query
    await new Promise(r => setTimeout(r, 1000))

    // Batch 3: Event log queries (heaviest - uses longer timeout)
    try {
      const burnAddress = "0x0000000000000000000000000000000000000369"
      const vaultAddress = "0xD1fB678aB14429140c06AfFFCC878F9c41F48787"
      const hoardAddr = "0x1FEe39A78Bd2cf20C11B99Bd1dF08d5b2fCc0b9a"
      const transferFilter = smaugContract.filters.Transfer
      const [vaultBurnEvents, hoardBurnEvents] = await Promise.all([
        rpcRetry(() => smaugContract.queryFilter(transferFilter(vaultAddress, burnAddress)), 2, 3000),
        rpcRetry(() => smaugContract.queryFilter(transferFilter(hoardAddr, burnAddress)), 2, 3000),
      ])
      const vaultBurnTotal = vaultBurnEvents.reduce((sum, e) => {
        const log = e as ethers.EventLog
        return sum + Number(ethers.formatEther(log.args[2]))
      }, 0)
      const hoardBurnTotal = hoardBurnEvents.reduce((sum, e) => {
        const log = e as ethers.EventLog
        return sum + Number(ethers.formatEther(log.args[2]))
      }, 0)
      setSmaugVaultBurned(vaultBurnTotal)
      setSmaugHoardBurned(hoardBurnTotal)
      console.log("[v0] Burn events fetched")
    } catch (err) {
      console.error("[v0] Error fetching burn events:", err)
    }
  }

  const fetchTotalDistributed = async () => {
    console.log("[v0] Starting fetchTotalDistributed...")
    try {
      const provider = getProvider()

      // Opus distributor contract addresses (v1, v2, v3)
      const opusDistributors = [
        "0x7251d2965f165fCE18Ae5fC4c4979e01b46057d7", // v1
        "0x90501f0C51c3aaDc76c9b27E501b68Db153Dcc81", // v2
        "0xD14594f3c736E0D742Cfe2C3A177fb813c1C04B9", // v3
      ]

      // Coda distributor contract addresses (v1, v2, v3)
      const codaDistributors = [
        "0xD9857f41E67812dbDFfdD3269B550836EC131D0C", // v1
        "0x502E10403E20D6Ff42CBBDa7fdDC4e1315Da19AF", // v2
        "0x2924Dc56bb4eeF50d0d32D8aCD6AA7c61aFa5dfe", // v3
      ]

      let totalMissor = 0n
      let totalFinvesta = 0n
      let totalWgpp = 0n

      // Fetch all Opus distributor data in parallel
      const opusResults = await Promise.allSettled(
        opusDistributors.flatMap(address => {
          const contract = new ethers.Contract(address, DISTRIBUTOR_ABI, provider)
          return [
            rpcRetry(() => contract.totalMissorDistributed(), 1, 2000).then(v => ({ type: "missor" as const, value: BigInt(v) })),
            rpcRetry(() => contract.totalFinvestaDistributed(), 1, 2000).then(v => ({ type: "finvesta" as const, value: BigInt(v) })),
            rpcRetry(() => contract.totalWgppDistributed(), 1, 2000).then(v => ({ type: "wgpp" as const, value: BigInt(v) })),
          ]
        })
      )
      for (const r of opusResults) {
        if (r.status === "fulfilled") {
          if (r.value.type === "missor") totalMissor += r.value.value
          else if (r.value.type === "finvesta") totalFinvesta += r.value.value
          else if (r.value.type === "wgpp") totalWgpp += r.value.value
        }
      }
      console.log("[v0] Opus distributors fetched")

      let totalWeth = 0n
      let totalPwbtc = 0n
      let totalPlsx = 0n

      // Fetch all Coda distributor data in parallel
      const codaResults = await Promise.allSettled(
        codaDistributors.flatMap(address => {
          const contract = new ethers.Contract(address, DISTRIBUTOR_ABI, provider)
          return [
            rpcRetry(() => contract.totalWethDistributed(), 1, 2000).then(v => ({ type: "weth" as const, value: BigInt(v) })),
            rpcRetry(() => contract.totalWbtcDistributed(), 1, 2000).then(v => ({ type: "pwbtc" as const, value: BigInt(v) })),
            rpcRetry(() => contract.totalPlsxDistributed(), 1, 2000).then(v => ({ type: "plsx" as const, value: BigInt(v) })),
          ]
        })
      )
      for (const r of codaResults) {
        if (r.status === "fulfilled") {
          if (r.value.type === "weth") totalWeth += r.value.value
          else if (r.value.type === "pwbtc") totalPwbtc += r.value.value
          else if (r.value.type === "plsx") totalPlsx += r.value.value
        }
      }
      console.log("[v0] Coda distributors fetched")

      console.log("[v0] Total Missor:", totalMissor.toString())
      console.log("[v0] Total Finvesta:", totalFinvesta.toString())
      console.log("[v0] Total WGPP:", totalWgpp.toString())
      console.log("[v0] Total WETH:", totalWeth.toString())
      console.log("[v0] Total pWBTC:", totalPwbtc.toString())
      console.log("[v0] Total PLSX:", totalPlsx.toString())

      setTotalDistributed({
        missor: ethers.formatUnits(totalMissor, 18),
        finvesta: ethers.formatUnits(totalFinvesta, 8),
        wgpp: ethers.formatUnits(totalWgpp, 18),
        weth: ethers.formatUnits(totalWeth, 18),
        Pwbtc: ethers.formatUnits(totalPwbtc, 8),
        plsx: ethers.formatUnits(totalPlsx, 18),
      })
    } catch (err) {
      console.error("Error fetching total distributed:", err)
    }
  }

  const saveWalletList = async () => {
    if (!savedName.trim()) {
      setSaveMessage("Please enter a name")
      return
    }
    if (walletAddresses.some((addr) => !addr.trim())) {
      setSaveMessage("Please enter valid wallet addresses")
      return
    }

    try {
      const response = await fetch("/api/saved-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: savedName.toLowerCase().trim(),
          addresses: walletAddresses,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSaveMessage(`Saved as "${savedName}"`)
        setSavedName("")
        setTimeout(() => setSaveMessage(""), 3000)
      } else {
        setSaveMessage(data.error || "Failed to save")
        setTimeout(() => setSaveMessage(""), 3000)
      }
    } catch (err) {
      console.error("[v0] Error saving wallet list:", err)
      setSaveMessage("Failed to save wallet list")
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

  const loadWallets = async () => {
    const name = loadName.trim()
    if (!name) {
      setSaveMessage("Please enter a name to load")
      setTimeout(() => setSaveMessage(""), 3000)
      return
    }

    try {
      const response = await fetch(`/api/saved-wallets?name=${encodeURIComponent(name.toLowerCase().trim())}`)
      const data = await response.json()

      if (data.addresses && data.addresses.length > 0) {
        setWalletAddresses(data.addresses)
        setSaveMessage(`Loaded "${name}"`)
        setLoadName("")
        await fetchRewards(data.addresses)
      } else {
        setSaveMessage("No wallet list found with that name")
      }
    } catch (error) {
      console.error("Error loading wallets:", error)
      setSaveMessage("Failed to load wallets")
    }
  }

  const deleteSavedList = (name: string) => {
    // Implement deletion from database here if needed
  }

  const fetchTokenPrices = async () => {
    // Re-fetch from server cache (will be instant if already cached)
    const prices = await fetchCachedPrices()
    applyTokenPrices(prices)
  }

  const fetchRewards = async (addressesToFetch?: string[]) => {
    const addresses = addressesToFetch || walletAddresses

    if (addresses.some((addr) => !addr.trim())) {
      setError("Please enter valid wallet addresses")
      return
    }

    setLoading(true)
    setError("")
    setRewards([]) // Clear previous rewards
    setWalletRewards(null) // Clear individual wallet rewards as well
    setTotalRewards(null) // Reset total rewards
    await fetchTotalDistributed() // Fetch total distributed amounts

    await fetchTokenPrices()

    try {
      const provider = getProvider()
      const opusContract = new ethers.Contract(OPUS_CONTRACT, OPUS_ABI, provider)
      // </CHANGE> Fixed CODA contract initialization - was passing CODA_ABI twice instead of CODA_CONTRACT address
      const codaContract = new ethers.Contract(CODA_CONTRACT, CODA_ABI, provider)

      const opusTokenContract = new ethers.Contract(OPUS_CONTRACT, BALANCE_ABI, provider)
      const codaTokenContract = new ethers.Contract(CODA_CONTRACT, BALANCE_ABI, provider)

      const opusV1Contract = new ethers.Contract(OPUS_V1_CONTRACT, SHARES_ABI, provider)
      const opusV2Contract = new ethers.Contract(OPUS_V2_CONTRACT, SHARES_ABI, provider)
      const codaV1Contract = new ethers.Contract(CODA_V1_CONTRACT, CODA_SHARES_ABI, provider)
      const codaV2Contract = new ethers.Contract(CODA_V2_CONTRACT, CODA_SHARES_ABI, provider)

      const allRewards = []
      let distributedMissor = 0n
      let distributedFinvesta = 0n
      let distributedWgpp = 0n
      let distributedWeth = 0n
      let distributedPWbtc = 0n
      let distributedPlsx = 0n

      for (const address of addresses) {
        console.log("[v0] Fetching rewards for:", address)

        let opusMissor = 0n
        let opusFinvesta = 0n
        let opusWgpp = 0n
        let codaWeth = 0n
        let codaPWbtc = 0n
        let codaPlsx = 0n

        let opusBalance = 0n
        let codaBalance = 0n

        try {
          const opusBalanceRaw = await opusTokenContract.balanceOf(address)
          opusBalance = BigInt(opusBalanceRaw)
          console.log("[v0] Opus balance:", opusBalance.toString())
        } catch (err) {
          console.error("[v0] Error fetching Opus balance:", err)
        }

        try {
          const codaBalanceRaw = await codaTokenContract.balanceOf(address)
          codaBalance = BigInt(codaBalanceRaw)
          console.log("[v0] Coda balance:", codaBalance.toString())
        } catch (err) {
          console.error("[v0] Error fetching Coda balance:", err)
        }

        try {
          const opusMissorRaw = await opusContract.getTotalMissorEarned(address)
          opusMissor = BigInt(opusMissorRaw)
          console.log("[v0] Opus Missor (v3):", opusMissor.toString())
        } catch (err) {
          console.error("[v0] Error fetching Opus Missor:", err)
        }

        try {
          const opusFinvestaRaw = await opusContract.getTotalFinvestaEarned(address)
          opusFinvesta = BigInt(opusFinvestaRaw)
          console.log("[v0] Opus Finvesta (v3):", opusFinvesta.toString())
        } catch (err) {
          console.error("[v0] Error fetching Opus Finvesta:", err)
        }

        try {
          const opusWgppRaw = await opusContract.getTotalWgppEarned(address)
          opusWgpp = BigInt(opusWgppRaw)
          console.log("[v0] Opus WGPP (v3):", opusWgpp.toString())
        } catch (err) {
          console.error("[v0] Error fetching Opus WGPP:", err)
        }

        try {
          const codaWethRaw = await codaContract.getTotalWethEarned(address)
          codaWeth = BigInt(codaWethRaw)
          console.log("[v0] Coda WETH (v3):", codaWeth.toString())
        } catch (err) {
          console.error("[v0] Error fetching Coda WETH:", err)
        }

        try {
          const codaPWbtcRaw = await codaContract.getTotalWbtcEarned(address)
          codaPWbtc = BigInt(codaPWbtcRaw)
          console.log("[v0] Coda pWBTC (v3):", codaPWbtc.toString())
        } catch (err) {
          console.error("[v0] Error fetching Coda pWBTC:", err)
        }

        try {
          const codaPlsxRaw = await codaContract.getTotalPlsxEarned(address)
          codaPlsx = BigInt(codaPlsxRaw)
          console.log("[v0] Coda PLSX (v3):", codaPlsx.toString())
        } catch (err) {
          console.error("[v0] Error fetching Coda PLSX:", err)
        }

        try {
          const opusV1Shares = await opusV1Contract.shares(address)
          const missorV1 = BigInt(opusV1Shares[2]) // missorTotalRealised at index 2
          const finvestaV1 = BigInt(opusV1Shares[4]) // finvestaTotalRealised at index 4
          const wgppV1 = BigInt(opusV1Shares[6]) // wgppTotalRealised at index 6
          opusMissor += missorV1
          opusFinvesta += finvestaV1
          opusWgpp += wgppV1
          console.log(
            "[v0] Opus v1 historical - Missor:",
            missorV1.toString(),
            "Finvesta:",
            finvestaV1.toString(),
            "WGPP:",
            wgppV1.toString(),
          )
        } catch (err) {
          console.error("[v0] Error fetching Opus v1 historical rewards:", err)
        }

        try {
          const opusV2Shares = await opusV2Contract.shares(address)
          const missorV2 = BigInt(opusV2Shares[2]) // missorTotalRealised at index 2
          const finvestaV2 = BigInt(opusV2Shares[4]) // finvestaTotalRealised at index 4
          const wgppV2 = BigInt(opusV2Shares[6]) // wgppTotalRealised at index 6
          opusMissor += missorV2
          opusFinvesta += finvestaV2
          opusWgpp += wgppV2
          console.log(
            "[v0] Opus v2 historical - Missor:",
            missorV2.toString(),
            "Finvesta:",
            finvestaV2.toString(),
            "WGPP:",
            wgppV2.toString(),
          )
        } catch (err) {
          console.error("[v0] Error fetching Opus v2 historical rewards:", err)
        }

        try {
          const codaV1Shares = await codaV1Contract.shares(address)
          const wethV1 = BigInt(codaV1Shares[2]) // wethTotalRealised at index 2
          const wbtcV1 = BigInt(codaV1Shares[4]) // wbtcTotalRealised at index 4
          const plsxV1 = BigInt(codaV1Shares[6]) // plsTotalRealised at index 6
          codaWeth += wethV1
          codaPWbtc += wbtcV1
          codaPlsx += plsxV1
          console.log(
            "[v0] Coda v1 historical - WETH:",
            wethV1.toString(),
            "pWBTC:",
            wbtcV1.toString(),
            "PLSX:",
            plsxV1.toString(),
          )
        } catch (err) {
          console.error("[v0] Error fetching Coda v1 historical rewards:", err)
        }

        try {
          const codaV2Shares = await codaV2Contract.shares(address)
          const wethV2 = BigInt(codaV2Shares[2]) // wethTotalRealised at index 2
          const wbtcV2 = BigInt(codaV2Shares[4]) // wbtcTotalRealised at index 4
          const plsxV2 = BigInt(codaV2Shares[6]) // plsTotalRealised at index 6
          codaWeth += wethV2
          codaPWbtc += wbtcV2
          codaPlsx += plsxV2
          console.log(
            "[v0] Coda v2 historical - WETH:",
            wethV2.toString(),
            "pWBTC:",
            wbtcV2.toString(),
            "PLSX:",
            plsxV2.toString(),
          )
        } catch (err) {
          console.error("[v0] Error fetching Coda v2 historical rewards:", err)
        }

        distributedMissor += opusMissor
        distributedFinvesta += opusFinvesta
        distributedWgpp += opusWgpp
        distributedWeth += codaWeth
        distributedPWbtc += codaPWbtc
        distributedPlsx += codaPlsx

        allRewards.push({
          address,
          opus: {
            missor: ethers.formatUnits(opusMissor, 18),
            finvesta: ethers.formatUnits(opusFinvesta, 8),
            wgpp: ethers.formatUnits(opusWgpp, 18),
          },
          coda: {
            weth: ethers.formatUnits(codaWeth, 18),
            Pwbtc: ethers.formatUnits(codaPWbtc, 8),
            plsx: ethers.formatUnits(codaPlsx, 18),
          },
          holdings: {
            opus: ethers.formatUnits(opusBalance, 18),
            coda: ethers.formatUnits(codaBalance, 18),
          },
        })
      }

      // Fetch HEX and HSI stakes for all addresses
      const allHexStakes: any[] = []
      const allHsiStakes: any[] = []
      const ethereumProvider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL)

      for (const address of addresses) {
        // Fetch HEX Stakes (Pulsechain)
        try {
          const hexContract = new ethers.Contract(HEX_PULSECHAIN_ADDRESS, HEX_STAKING_ABI, provider)
          const currentDay = await hexContract.currentDay()
          const stakeCount = await hexContract.stakeCount(address)
          
          for (let i = 0; i < Number(stakeCount); i++) {
            try {
              const stake = await hexContract.stakeLists(address, i)
              const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
              const stakeShares = ethers.formatUnits(stake.stakeShares, 12)
              const daysPassed = Number(currentDay) - Number(stake.lockedDay)
              const daysRemaining = Number(stake.stakedDays) - daysPassed
              const isActive = stake.unlockedDay === 0
              
              allHexStakes.push({
                wallet: address,
                chain: "Pulsechain",
                stakeId: stake.stakeId.toString(),
                stakedHearts: Number(stakedHearts),
                stakeShares: Number(stakeShares),
                lockedDay: Number(stake.lockedDay),
                stakedDays: Number(stake.stakedDays),
                unlockedDay: Number(stake.unlockedDay),
                currentDay: Number(currentDay),
                daysPassed,
                daysRemaining: Math.max(0, daysRemaining),
                isActive,
              })
            } catch {}
          }
        } catch {}

        // Fetch HEX Stakes (Ethereum) with timeout
        try {
          console.log(`[v0] Fetching Ethereum HEX stakes for ${address}`)
          const fetchEthereumHEX = async () => {
            const hexEthContract = new ethers.Contract(HEX_ETHEREUM_ADDRESS, HEX_STAKING_ABI, ethereumProvider)
            const currentDay = await hexEthContract.currentDay()
            console.log(`[v0] Ethereum HEX currentDay: ${currentDay}`)
            const stakeCount = await hexEthContract.stakeCount(address)
            console.log(`[v0] Ethereum HEX stake count for ${address}: ${stakeCount}`)
            for (let i = 0; i < Number(stakeCount); i++) {
              try {
                const stake = await hexEthContract.stakeLists(address, i)
                const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
                const stakeShares = ethers.formatUnits(stake.stakeShares, 12)
                const daysPassed = Number(currentDay) - Number(stake.lockedDay)
                const daysRemaining = Number(stake.stakedDays) - daysPassed
                const isActive = stake.unlockedDay === 0
                console.log(`[v0] Found Ethereum HEX stake ${i}: ${stakedHearts} HEX`)
                allHexStakes.push({
                  wallet: address,
                  chain: "Ethereum",
                  stakeId: stake.stakeId.toString(),
                  stakedHearts: Number(stakedHearts),
                  stakeShares: Number(stakeShares),
                  lockedDay: Number(stake.lockedDay),
                  stakedDays: Number(stake.stakedDays),
                  unlockedDay: Number(stake.unlockedDay),
                  currentDay: Number(currentDay),
                  daysPassed,
                  daysRemaining: Math.max(0, daysRemaining),
                  isActive,
                })
              } catch (stakeErr) {
                console.error(`[v0] Error fetching Ethereum HEX stake ${i}:`, stakeErr)
              }
            }
          }
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Ethereum timeout")), ETHEREUM_TIMEOUT)
          )
          await Promise.race([fetchEthereumHEX(), timeoutPromise])
        } catch (ethErr) {
          console.error(`[v0] Ethereum HEX fetch error:`, ethErr)
        }

        // Fetch HSI Stakes (Pulsechain)
        try {
          const hsiContract = new ethers.Contract(HSI_MANAGER_ADDRESS, HSI_MANAGER_ABI, provider)
          const hexContract = new ethers.Contract(HEX_PULSECHAIN_ADDRESS, HEX_STAKING_ABI, provider)
          const currentDay = await hexContract.currentDay()
          const hsiStakeCount = await hsiContract.stakeCount(address)
          
          for (let i = 0; i < Number(hsiStakeCount); i++) {
            try {
              const stake = await hsiContract.stakeLists(address, i)
              const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
              const stakeShares = ethers.formatUnits(stake.stakeShares, 12)
              const daysPassed = Number(currentDay) - Number(stake.lockedDay)
              const daysRemaining = Number(stake.stakedDays) - daysPassed
              const isActive = stake.unlockedDay === 0
              
              allHsiStakes.push({
                wallet: address,
                chain: "Pulsechain",
                stakeId: stake.stakeId.toString(),
                stakedHearts: Number(stakedHearts),
                stakeShares: Number(stakeShares),
                lockedDay: Number(stake.lockedDay),
                stakedDays: Number(stake.stakedDays),
                unlockedDay: Number(stake.unlockedDay),
                currentDay: Number(currentDay),
                daysPassed,
                daysRemaining: Math.max(0, daysRemaining),
                isAutoStake: stake.isAutoStake,
                isActive,
              })
            } catch {}
          }
        } catch {}

        // Fetch HSI Stakes (Ethereum) with timeout
        try {
          console.log(`[v0] Fetching Ethereum HSI stakes for ${address}`)
          const fetchEthereumHSI = async () => {
            const hsiEthContract = new ethers.Contract(HSI_MANAGER_ETHEREUM_ADDRESS, HSI_MANAGER_ABI, ethereumProvider)
            const hexEthContract = new ethers.Contract(HEX_ETHEREUM_ADDRESS, HEX_STAKING_ABI, ethereumProvider)
            const currentDay = await hexEthContract.currentDay()
            const hsiStakeCount = await hsiEthContract.stakeCount(address)
            console.log(`[v0] Ethereum HSI stake count for ${address}: ${hsiStakeCount}`)
            for (let i = 0; i < Number(hsiStakeCount); i++) {
              try {
                const stake = await hsiEthContract.stakeLists(address, i)
                const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
                const stakeShares = ethers.formatUnits(stake.stakeShares, 12)
                const daysPassed = Number(currentDay) - Number(stake.lockedDay)
                const daysRemaining = Number(stake.stakedDays) - daysPassed
                const isActive = stake.unlockedDay === 0
                console.log(`[v0] Found Ethereum HSI stake ${i}: ${stakedHearts} HEX`)
                allHsiStakes.push({
                  wallet: address,
                  chain: "Ethereum",
                  stakeId: stake.stakeId.toString(),
                  stakedHearts: Number(stakedHearts),
                  stakeShares: Number(stakeShares),
                  lockedDay: Number(stake.lockedDay),
                  stakedDays: Number(stake.stakedDays),
                  unlockedDay: Number(stake.unlockedDay),
                  currentDay: Number(currentDay),
                  daysPassed,
                  daysRemaining: Math.max(0, daysRemaining),
                  isAutoStake: stake.isAutoStake,
                  isActive,
                })
              } catch (stakeErr) {
                console.error(`[v0] Error fetching Ethereum HSI stake ${i}:`, stakeErr)
              }
            }
          }
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Ethereum HSI timeout")), ETHEREUM_TIMEOUT)
          )
          await Promise.race([fetchEthereumHSI(), timeoutPromise])
        } catch (ethHsiErr) {
          console.error(`[v0] Ethereum HSI fetch error:`, ethHsiErr)
        }
      }

      console.log(`[v0] Total HEX stakes found: ${allHexStakes.length} (PLS: ${allHexStakes.filter(s => s.chain === "Pulsechain").length}, ETH: ${allHexStakes.filter(s => s.chain === "Ethereum").length})`)
      console.log(`[v0] Total HSI stakes found: ${allHsiStakes.length} (PLS: ${allHsiStakes.filter(s => s.chain === "Pulsechain").length}, ETH: ${allHsiStakes.filter(s => s.chain === "Ethereum").length})`)

      // Sort stakes by chain then days remaining
      setHexStakes(allHexStakes.sort((a, b) => {
        if (a.chain !== b.chain) return a.chain === "Pulsechain" ? -1 : 1
        return a.daysRemaining - b.daysRemaining
      }))
      setHsiStakes(allHsiStakes.sort((a, b) => {
        if (a.chain !== b.chain) return a.chain === "Pulsechain" ? -1 : 1
        return a.daysRemaining - b.daysRemaining
      }))

      // Use cached HEX prices
      const cp = cachedPricesRef.current
      if (cp) {
        setHexPricePulsechain(cp.hexPulsechain || 0)
        setHexPriceEthereum(cp.hexEthereum || 0)
      }

      // Fetch token balances for all addresses
      let totalPls = 0
      let totalPlsx = 0
      let totalInc = 0
      let totalPHex = 0
      let totalEHexFromEthereum = 0
      let totalEHex = 0
      let totalPWbtc = 0
      let totalSmaug = 0

      for (const address of addresses) {
        try {
          // PLS (native token)
          const plsBalance = await provider.getBalance(address)
          totalPls += Number(ethers.formatEther(plsBalance))

          // PLSX
          const plsxContract = new ethers.Contract(PLSX_ADDRESS, BALANCE_ABI, provider)
          const plsxBalance = await plsxContract.balanceOf(address)
          totalPlsx += Number(ethers.formatEther(plsxBalance))

          // INC
          const incContract = new ethers.Contract(INC_ADDRESS, BALANCE_ABI, provider)
          const incBalance = await incContract.balanceOf(address)
          totalInc += Number(ethers.formatEther(incBalance))

          // pHEX (HEX on Pulsechain)
          const pHexContract = new ethers.Contract(HEX_PULSECHAIN_ADDRESS, BALANCE_ABI, provider)
          const pHexBalance = await pHexContract.balanceOf(address)
          totalPHex += Number(ethers.formatUnits(pHexBalance, 8))

          // eHEX from Ethereum (bridged to Pulsechain)
          const eHexFromEthContract = new ethers.Contract(EHEX_FROM_ETHEREUM_ADDRESS, BALANCE_ABI, provider)
          const eHexFromEthBalance = await eHexFromEthContract.balanceOf(address)
          totalEHexFromEthereum += Number(ethers.formatUnits(eHexFromEthBalance, 8))

          // pWBTC on Pulsechain
          const pWbtcContract = new ethers.Contract(PWBTC_ADDRESS, BALANCE_ABI, provider)
          const pWbtcBalance = await pWbtcContract.balanceOf(address)
          totalPWbtc += Number(ethers.formatUnits(pWbtcBalance, 8))

          // Smaug
          const smaugContract = new ethers.Contract(SMAUG_ADDRESS, BALANCE_ABI, provider)
          const smaugBalance = await smaugContract.balanceOf(address)
          totalSmaug += Number(ethers.formatEther(smaugBalance))
        } catch (err) {
          console.error(`[v0] Error fetching Pulsechain token balances for ${address}:`, err)
        }

        // Fetch eHEX on Ethereum
        try {
          const eHexContract = new ethers.Contract(HEX_ETHEREUM_ADDRESS, BALANCE_ABI, ethereumProvider)
          const eHexBalance = await eHexContract.balanceOf(address)
          totalEHex += Number(ethers.formatUnits(eHexBalance, 8))
        } catch (err) {
          console.error(`[v0] Error fetching Ethereum HEX balance for ${address}:`, err)
        }
      }

      setTokenBalances({
        pls: totalPls,
        plsx: totalPlsx,
        inc: totalInc,
        pHex: totalPHex,
        eHexFromEthereum: totalEHexFromEthereum,
        eHex: totalEHex,
        pWbtc: totalPWbtc,
        smaug: totalSmaug,
      })

      // Use cached token prices
      const cachedP = cachedPricesRef.current
      if (cachedP) {
        setTokenPricesAll({
          pls: cachedP.pls || 0,
          plsx: cachedP.plsx || 0,
          inc: cachedP.inc || 0,
          pHex: cachedP.hexPulsechain || 0,
          eHex: cachedP.hexEthereum || 0,
          wbtc: cachedP.pwbtc || 0,
        })
      }

      // Fetch Liquid Loans vaults
      const allLiquidLoansVaults: Array<{ wallet: string; lockedPLS: number; debt: number }> = []
      const vaultManager = new ethers.Contract(LIQUID_LOANS_VAULT_MANAGER, LIQUID_LOANS_ABI, provider)
      
      for (const address of addresses) {
        try {
          const lockedPLS = await vaultManager.getVaultColl(address)
          const debtUSDL = await vaultManager.getVaultDebt(address)
          if (lockedPLS > 0 || debtUSDL > 0) {
            allLiquidLoansVaults.push({
              wallet: address,
              lockedPLS: Number(ethers.formatEther(lockedPLS)),
              debt: Number(ethers.formatEther(debtUSDL)),
            })
          }
        } catch (vaultErr) {
          console.error(`[v0] Liquid Loans error for ${address}:`, vaultErr)
        }
      }
      
      setLiquidLoansVaults(allLiquidLoansVaults)

      setRewards(allRewards)

      const totals = allRewards.reduce(
        (acc, wallet) => ({
          opus: {
            missor: (Number.parseFloat(acc.opus.missor) + Number.parseFloat(wallet.opus.missor)).toString(),
            finvesta: (Number.parseFloat(acc.opus.finvesta) + Number.parseFloat(wallet.opus.finvesta)).toString(),
            wgpp: (Number.parseFloat(acc.opus.wgpp) + Number.parseFloat(wallet.opus.wgpp)).toString(),
          },
          coda: {
            weth: (Number.parseFloat(acc.coda.weth) + Number.parseFloat(wallet.coda.weth)).toString(),
            Pwbtc: (Number.parseFloat(acc.coda.Pwbtc) + Number.parseFloat(wallet.coda.Pwbtc)).toString(),
            plsx: (Number.parseFloat(acc.coda.plsx) + Number.parseFloat(wallet.coda.plsx)).toString(),
          },
        }),
        {
          opus: { missor: "0", finvesta: "0", wgpp: "0" },
          coda: { weth: "0", Pwbtc: "0", plsx: "0" },
        },
      )
      setTotalRewards(totals)

      // The totalDistributed state should only contain GLOBAL distributed amounts from fetchTotalDistributed()
      // Wallet-specific totals are already stored in totalRewards above
    } catch (err) {
      console.error("[v0] Error fetching rewards:", err)
      setError("Failed to fetch rewards. Please check the wallet addresses and try again.")
    } finally {
      setLoading(false)
    }
  }

  const addWallet = () => {
    const newWalletAddress = ""
    setWalletAddresses([...walletAddresses, newWalletAddress])
  }

  const removeWallet = (index: number) => {
    const newAddresses = walletAddresses.filter((_, i) => i !== index)
    setWalletAddresses(newAddresses.length > 0 ? newAddresses : [""])
  }

  const updateWalletAddress = (index: number, value: string) => {
    const newAddresses = [...walletAddresses]
    newAddresses[index] = value

    // Check for duplicates
    const normalizedValue = value.trim().toLowerCase()
    const isDuplicate = walletAddresses.some((addr, i) => i !== index && addr.trim().toLowerCase() === normalizedValue)

    if (isDuplicate) {
      setDuplicateWarning("This wallet address is already added")
      setTimeout(() => setDuplicateWarning(""), 3000)
      // Optionally, you might want to revert the change or prevent it from being applied
    } else {
      setDuplicateWarning("") // Clear the warning if the address is not a duplicate
      setWalletAddresses(newAddresses)
    }
  }

  // Calculate total accumulated value and percentage for display
  const totalAccumulatedValue =
    totalRewards &&
    tokenPrices.missor > 0 &&
    tokenPrices.finvesta > 0 &&
    tokenPrices.wgpp > 0 &&
    tokenPrices.weth > 0 &&
    tokenPrices.Pwbtc > 0 &&
    tokenPrices.plsx > 0
      ? Number.parseFloat(totalRewards.opus.missor) * tokenPrices.missor +
        Number.parseFloat(totalRewards.opus.finvesta) * tokenPrices.finvesta +
        Number.parseFloat(totalRewards.opus.wgpp) * tokenPrices.wgpp +
        Number.parseFloat(totalRewards.coda.weth) * tokenPrices.weth +
        Number.parseFloat(totalRewards.coda.Pwbtc) * tokenPrices.Pwbtc +
        Number.parseFloat(totalRewards.coda.plsx) * tokenPrices.plsx
      : 0

  const totalPortfolioValue = tokenPrices.missor > 0 && tokenPrices.finvesta > 0 && tokenPrices.wgpp > 0 &&
  tokenPrices.weth > 0 && tokenPrices.Pwbtc > 0 && tokenPrices.plsx > 0
  ? rewards.reduce((sum, w) => 
      sum + Number.parseFloat(w.holdings.opus) * tokenPrices.opus + 
            Number.parseFloat(w.holdings.coda) * tokenPrices.coda, 
    0)
  : 0;    

  const totalDistributedValue =
    totalDistributed &&
    tokenPrices.missor > 0 &&
    tokenPrices.finvesta > 0 &&
    tokenPrices.wgpp > 0 &&
    tokenPrices.weth > 0 &&
    tokenPrices.Pwbtc > 0 &&
    tokenPrices.plsx > 0
      ? Number.parseFloat(totalDistributed.missor) * tokenPrices.missor +
        Number.parseFloat(totalDistributed.finvesta) * tokenPrices.finvesta +
        Number.parseFloat(totalDistributed.wgpp) * tokenPrices.wgpp +
        Number.parseFloat(totalDistributed.weth) * tokenPrices.weth +
        Number.parseFloat(totalDistributed.Pwbtc) * tokenPrices.Pwbtc +
        Number.parseFloat(totalDistributed.plsx) * tokenPrices.plsx
      : 0

  const percentage = totalDistributedValue > 0 ? (totalAccumulatedValue / totalPortfolioValue) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#111c3a] to-[#0a1628]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-5xl w-full mx-auto px-4 py-8"
      >
        <h1 className="text-center text-6xl md:text-8xl font-marcellus font-normal tracking-tight text-slate-200 mb-12">
          The Opus Ecosystem
        </h1>
        <Card className="bg-[#0f172a]/90 backdrop-blur border border-blue-900/40 shadow-[0_0_80px_rgba(56,189,248,0.08)] rounded-3xl">
          <CardContent className="py-12 flex flex-col gap-14">
            <div className="text-center space-y-8">
              
            </div>

            {/* Smaug Section */}
            <div>
              <div className="rounded-2xl bg-gradient-to-br from-[#0a1a0a] to-[#111c3a] border border-green-900/40 p-8">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                  <img
                    src="/images/dragon-dore.png"
                    alt="Dragon illustration by Gustave Doré"
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl shadow-[0_0_60px_rgba(34,197,94,0.3)] object-cover"
                  />
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl md:text-4xl font-marcellus text-green-300 mb-3">Smaug — The last of the three pillars</h3>
                    <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl mb-4">
                      
                    </p>
                    <ul className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl space-y-2">
                      <li className="flex gap-2"><span className="text-green-300">{'•'}</span><span><strong className="text-green-300">Opus</strong> — The first core printer token that consistently distributes Finvesta, Missor, and WGPP</span></li>
                      <li className="flex gap-2"><span className="text-green-300">{'•'}</span><span><strong className="text-green-300">Coda</strong> — The second printer token that consistently distributes WETH, pWBTC and PLSX</span></li>
                      <li className="flex gap-2"><span className="text-green-300">{'•'}</span><span><strong className="text-green-300">Smaug</strong> — The sole deflationary token with reflections and four separate buy and burns</span></li>
                    </ul>
                  </div>
                </div>

                {/* Token Mechanics & Metrics */}
                <h3 className="text-2xl font-marcellus text-green-300 mb-4 text-center">Anatomy of Smaug:</h3>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="rounded-2xl bg-[#111c3a] border border-green-900/30 p-7 shadow-inner">
  <h4 className="text-xl font-medium text-green-300 mb-4 text-center">Tokenomics — 6.50%</h4>
  <ul className="space-y-2 text-slate-300">
    <li className="flex justify-between">
      <span>Buy & burn</span>
      <span className="text-green-300 font-medium">3.5%</span>
    </li>
    <li className="flex justify-between">
      <span>Reflections to holders</span>
      <span className="text-green-300 font-medium">1.5%</span>
    </li>
    <li className="flex justify-between">
      <span>Added to Smaug's Vault</span>
      <span className="text-green-300 font-medium">1.0%</span>
    </li>
    <li className="flex justify-between">
      <span>Added to locked LP</span>
      <span className="text-green-300 font-medium">0.5%</span>
    </li>
  </ul>
  {smaugLpAddedData && (
    <div className="text-xs text-slate-400 mt-4 text-center">
      Locked PLS added: {formatMillions(smaugLpAddedData.totalPLS)}
    </div>
  )}
</div>
                  <div className="rounded-2xl bg-[#111c3a] border border-green-900/30 p-7 shadow-inner">
                    <h4 className="text-xl font-medium text-green-300 mb-4 text-center">Smaug's Ledger</h4>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex justify-between">
                        <span>Total Supply</span>
                        <span className="text-green-300 font-medium">1,000,000,000</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Smaug Burned</span>
                        <span className="text-green-300 font-medium">
                          {smaugTotalBurned > 0
                            ? `${smaugTotalBurned.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${((smaugTotalBurned / 1_000_000_000) * 100).toFixed(2)}%)`
                            : "--"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Circulating Supply</span>
                        <span className="text-green-300 font-medium">
                          {smaugTotalBurned > 0
                            ? (1_000_000_000 - smaugTotalBurned).toLocaleString(undefined, { maximumFractionDigits: 0 })
                            : "--"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Market Cap</span>
                        <span className="text-green-300 font-medium">
                          {smaugMarketCap > 0 ? `$${smaugMarketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "--"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Liquidity</span>
                        <span className="text-green-300 font-medium">
                          {smaugLiquidity > 0 ? `$${smaugLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "--"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Smaug's Vault & The Hoard wallet */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="rounded-2xl bg-[#111c3a] border border-green-900/30 p-7 shadow-inner">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h4 className="text-xl font-medium text-green-300">Smaug's Vault</h4>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("0xD1fB678aB14429140c06AfFFCC878F9c41F48787")
                          setCopiedAddress("smaugVault")
                          setTimeout(() => setCopiedAddress(null), 2000)
                        }}
                        className="p-1 rounded hover:bg-green-900/30 transition-colors"
                        title="Copy the address"
                      >
                        {copiedAddress === "smaugVault" ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-slate-400 hover:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-400 text-sm text-center mb-5">
                      PLS in Smaug's vault is exclusively used to buy Smaug on 10–25% drawdowns and permanently burn them.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li>
                        <div className="flex justify-between">
                          <span>Ready-to-deploy buy & burn</span>
                          <span className="text-green-300 font-medium">
                            {smaugVaultPLS > 0 && plsPrice > 0 && smaugPrice > 0
                              ? `${((smaugVaultPLS * plsPrice) / smaugPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} Smaug`
                              : "--"}
                          </span>
                        </div>
                        {smaugVaultPLS > 0 && plsPrice > 0 && smaugPrice > 0 && (
                          <div className="text-right text-xs text-slate-400 mt-0.5">
                            ({(((smaugVaultPLS * plsPrice) / smaugPrice / 1_000_000_000) * 100).toFixed(3)}% of total supply)
                          </div>
                        )}
                      </li>
                      <li className="border-t border-green-900/20 pt-3">
                        <div className="flex justify-between mb-1">
                          <span>PLS balance</span>
                          <span className="text-green-300 font-medium">
                            {smaugVaultPLS > 0 ? smaugVaultPLS.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Value</span>
                          <span>{smaugVaultPLS > 0 && plsPrice > 0 ? `$${(smaugVaultPLS * plsPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}</span>
                        </div>
                      </li>
                      <li>
                        <div className="flex justify-between">
                          <span>Bought & burned to date</span>
                          <span className="text-green-300 font-medium">
                            {smaugVaultBurned > 0 ? (smaugVaultBurned + 2_495_267).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}
                          </span>
                        </div>
                        {smaugVaultBurned > 0 && (
                          <div className="text-right text-xs text-slate-400 mt-0.5">
                            ({(((smaugVaultBurned + 2_495_267) / 1_000_000_000) * 100).toFixed(3)}% of total supply)
                          </div>
                        )}
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-[#111c3a] border border-green-900/30 p-7 shadow-inner">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h4 className="text-xl font-medium text-green-300">Smaug's Hoard Wallet</h4>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("0x1FEe39A78Bd2cf20C11B99Bd1dF08d5b2fCc0b9a")
                          setCopiedAddress("theHoard")
                          setTimeout(() => setCopiedAddress(null), 2000)
                        }}
                        className="p-1 rounded hover:bg-green-900/30 transition-colors"
                        title="Copy the address"
                      >
                        {copiedAddress === "theHoard" ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-slate-400 hover:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-slate-400 text-sm text-center mb-5">
                      Smaug's hoard of assorted yield-generating printer tokens.
All yield is used multiple times a day to buy and burn Smaug.
                    </p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li>
                        <div className="flex justify-between">
                          <span>Ready-to-deploy buy & burn</span>
                          <span className="text-green-300 font-medium">
                            {(() => {
                              const plsVal = hoardData.pls * plsPrice
                              const wbtcVal = hoardData.pWbtc * hoardData.pWbtcPrice
                              const totalUsd = plsVal + wbtcVal
                              if (totalUsd > 0 && smaugPrice > 0) {
                                return `${(totalUsd / smaugPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} Smaug`
                              }
                              return "--"
                            })()}
                          </span>
                        </div>
                        {(() => {
                          const plsVal = hoardData.pls * plsPrice
                          const wbtcVal = hoardData.pWbtc * hoardData.pWbtcPrice
                          const totalUsd = plsVal + wbtcVal
                          const smaugEquiv = totalUsd > 0 && smaugPrice > 0 ? totalUsd / smaugPrice : 0
                          return smaugEquiv > 0 ? (
                            <div className="text-right text-xs text-slate-400 mt-0.5">
                              ({((smaugEquiv / 1_000_000_000) * 100).toFixed(3)}% of total supply)
                            </div>
                          ) : null
                        })()}
                      </li>
                      <li className="border-t border-green-900/20 pt-3">
                        <div className="flex justify-between mb-1">
                          <span>PLS balance</span>
                          <span className="text-green-300 font-medium">
                            {hoardData.pls > 0 ? hoardData.pls.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Value</span>
                          <span>{hoardData.pls > 0 && plsPrice > 0 ? `$${(hoardData.pls * plsPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}</span>
                        </div>
                      </li>
                      <li className="border-t border-green-900/20 pt-3">
                        <div className="flex justify-between mb-1">
                          <span>pWBTC</span>
                          <span className="text-green-300 font-medium">
                            {hoardData.pWbtc > 0 ? hoardData.pWbtc.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "--"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Value</span>
                          <span>{hoardData.pWbtc > 0 && hoardData.pWbtcPrice > 0 ? `$${(hoardData.pWbtc * hoardData.pWbtcPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}</span>
                        </div>
                      </li>
                      <li className="border-t border-green-900/20 pt-3 mt-1">
                        <div className="flex justify-between mb-2">
                          <span>Total printer value</span>
                          <span className="text-green-300 font-medium">
                            {(() => {
                              const gmVal = hoardData.gasMoney * hoardData.gasMoneyPrice
                              const domVal = hoardData.dominance * hoardData.dominancePrice
                              const total = gmVal + domVal
                              return total > 0 ? `$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"
                            })()}
                          </span>
                        </div>
                        <div className="ml-4 space-y-2">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-400">Gas Money</span>
                              <span className="text-green-300 font-medium">
                                {hoardData.gasMoney > 0 ? hoardData.gasMoney.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Value</span>
                              <span>{hoardData.gasMoney > 0 && hoardData.gasMoneyPrice > 0 ? `$${(hoardData.gasMoney * hoardData.gasMoneyPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-400">Dominance</span>
                              <span className="text-green-300 font-medium">
                                {hoardData.dominance > 0 ? hoardData.dominance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Value</span>
                              <span>{hoardData.dominance > 0 && hoardData.dominancePrice > 0 ? `$${(hoardData.dominance * hoardData.dominancePrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}</span>
                            </div>
                          </div>
                        </div>
                      </li>
                      <li className="border-t border-green-900/20 pt-3">
                        <div className="flex justify-between">
                          <span>Bought & burned to date</span>
                          <span className="text-green-300 font-medium">
                            {smaugHoardBurned > 0 ? smaugHoardBurned.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}
                          </span>
                        </div>
                        {smaugHoardBurned > 0 && (
                          <div className="text-right text-xs text-slate-400 mt-0.5">
                            ({((smaugHoardBurned / 1_000_000_000) * 100).toFixed(3)}% of total supply)
                          </div>
                        )}
                      </li>
                    </ul>
                  </div>
                </div>

                {/* The Lonely Mountain Reserve */}
                <div className="rounded-2xl bg-[#111c3a] border border-green-900/30 p-7 shadow-inner">
                  <h4 className="text-xl font-medium text-green-300 text-center mb-3">The Lonely Mountain Reserve</h4>
                  <p className="text-slate-300 text-sm leading-relaxed text-center max-w-3xl mx-auto">
                    This reserve holds 100 Finvesta and 100K Missor. When Finvesta surpasses $100 and/or Missor surpasses $0.10, these reserves will be used to slowly buy Smaug—creating upward price movement—and burn them—removing even more Smaug from circulation.
                  </p>
                </div>

              </div>
            </div>

            <h3 className="text-2xl font-marcellus text-sky-300 mb-4 text-center">What are Opus and Coda?</h3>
            <div className="rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(56,189,248,0.1)] bg-black">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube-nocookie.com/embed/gYR8UD9RlWg?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&loop=1&playlist=gYR8UD9RlWg"
                title="Opus and Coda explainer video"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={false}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">Reliable printing</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Our printers deliver a steady minimum 1% daily ROI.
                </p>
              </div>
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">No extraction paths</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  No privileged wallets. No silent drains. No broken promises.
                </p>
              </div>
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">Automatic payouts</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Simply hold Opus or Coda and your rewards arrive automatically.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="rounded-2xl bg-[#111c3a] border border-orange-900/30 p-7 shadow-inner">
                <h3 className="text-2xl font-medium mb-4 text-orange-300 text-center">Opus</h3>
                <p className="text-slate-200 text-lg mb-4 text-center font-semibold">6% Tax</p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex justify-between">
                    <span>Missor</span>
                    <span className="text-orange-300 font-medium">3%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Finvesta</span>
                    <span className="text-orange-300 font-medium">1%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>World's Greatest pDAI Printer</span>
                    <span className="text-orange-300 font-medium">1%</span>
                  </li>
                  <li className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                    <span>Added to liquidity</span>
                    <span className="text-orange-300 font-medium">1%</span>
                  </li>
                  {liquidityData.opus && (
                    <li className="text-xs text-slate-400 mt-3 space-y-1">
                      <div className="font-medium text-slate-300 mb-2">Total added to liquidity:</div>
                      <div className="flex justify-between pl-2">
                        <span>Opus</span>
                        <span>{formatMillions(liquidityData.opus.opusAdded)}</span>
                      </div>
                      <div className="flex justify-between pl-2">
                        <span>PLS</span>
                        <span>{formatMillions(liquidityData.opus.plsAdded)}</span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl bg-[#111c3a] border border-cyan-900/30 p-7 shadow-inner">
                <h3 className="text-2xl font-medium mb-4 text-cyan-300 text-center">Coda</h3>
                <p className="text-slate-200 text-lg mb-4 text-center font-semibold">7% Tax</p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex justify-between">
                    <span>WETH</span>
                    <span className="text-cyan-300 font-medium">2%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>pWBTC</span>
                    <span className="text-cyan-300 font-medium">2%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>PLSX</span>
                    <span className="text-cyan-300 font-medium">2%</span>
                  </li>
                  <li className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                    <span>Added to liquidity</span>
                    <span className="text-cyan-300 font-medium">1%</span>
                  </li>
                  {liquidityData.coda && (
                    <li className="text-xs text-slate-400 mt-3 space-y-1">
                      <div className="font-medium text-slate-300 mb-2">Total added to liquidity:</div>
                      <div className="flex justify-between pl-2">
                        <span>Coda</span>
                        <span>{formatMillions(liquidityData.coda.codaAdded)}</span>
                      </div>
                      <div className="flex justify-between pl-2">
                        <span>PLS</span>
                        <span>{formatMillions(liquidityData.coda.plsAdded)}</span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {totalDistributed && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-6xl mx-auto py-12 text-center"
              >
                <h2 className="text-2xl md:text-3xl font-medium text-center mb-8 text-slate-200">
                  Total distributed rewards: $
                  {formatWithCommas(
                    (
                      Number.parseFloat(totalDistributed.missor) * tokenPrices.missor +
                      Number.parseFloat(totalDistributed.finvesta) * tokenPrices.finvesta +
                      Number.parseFloat(totalDistributed.wgpp) * tokenPrices.wgpp +
                      Number.parseFloat(totalDistributed.weth) * tokenPrices.weth +
                      Number.parseFloat(totalDistributed.Pwbtc) * tokenPrices.Pwbtc +
                      Number.parseFloat(totalDistributed.plsx) * tokenPrices.plsx
                    ).toFixed(0),
                  )}
                </h2>
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* Opus Rewards */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-5">
                    <h3 className="text-lg font-medium text-orange-400 mb-4">Opus</h3>
                    <div className="space-y-5 text-left">
                      <div className="flex justify-between items-start gap-8">
                        <span className="text-slate-300">Missor:</span>
                        <div className="text-right">
                          <div className="text-slate-100">{formatMillions(totalDistributed.missor, 2)}</div>
                          <div className="text-slate-400 text-sm">
                            ($
                            {formatWithCommas(
                              (Number.parseFloat(totalDistributed.missor) * tokenPrices.missor).toFixed(2),
                            )}
                            )
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-start gap-8">
                        <span className="text-slate-300">Finvesta:</span>
                        <div className="text-right">
                          <div className="text-slate-100">{formatWithCommas(totalDistributed.finvesta)}</div>
                          <div className="text-slate-400 text-sm">
                            ($
                            {formatWithCommas(
                              (Number.parseFloat(totalDistributed.finvesta) * tokenPrices.finvesta).toFixed(2),
                            )}
                            )
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-start gap-8">
                        <span className="text-slate-300">WGPP:</span>
                        <div className="text-right">
                          <div className="text-slate-100">{formatWithCommas(totalDistributed.wgpp)}</div>
                          <div className="text-slate-400 text-sm">
                            ($
                            {formatWithCommas((Number.parseFloat(totalDistributed.wgpp) * tokenPrices.wgpp).toFixed(2))}
                            )
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coda Rewards */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-5">
                    <h3 className="text-lg font-medium text-cyan-400 mb-4">Coda</h3>
                    <div className="space-y-5 text-left">
                      <div className="flex justify-between items-start gap-8">
                        <span className="text-slate-300">WETH:</span>
                        <div className="text-right">
                          <div className="text-slate-100">{formatDecimals(totalDistributed.weth, 2)}</div>
                          <div className="text-slate-400 text-sm">
                            ($
                            {formatWithCommas((Number.parseFloat(totalDistributed.weth) * tokenPrices.weth).toFixed(2))}
                            )
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-start gap-8">
                        <span className="text-slate-300">pWBTC:</span>
                        <div className="text-right">
                          <div className="text-slate-100">{formatDecimals(totalDistributed.Pwbtc, 2)}</div>
                          <div className="text-slate-400 text-sm">
                            ($
                            {formatWithCommas(
                              (Number.parseFloat(totalDistributed.Pwbtc) * tokenPrices.Pwbtc).toFixed(2),
                            )}
                            )
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-start gap-8">
                        <span className="text-slate-300">PLSX:</span>
                        <div className="text-right">
                          <div className="text-slate-100">{formatBillions(totalDistributed.plsx, 2)}</div>
                          <div className="text-slate-400 text-sm">
                            ($
                            {formatWithCommas((Number.parseFloat(totalDistributed.plsx) * tokenPrices.plsx).toFixed(2))}
                            )
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-6xl mx-auto py-16 px-4 text-center"
            >
              <h2 className="text-2xl md:text-3xl font-medium text-center mb-12 text-slate-200">
                See what your wallets hold
              </h2>

              <div className="space-y-6 max-w-4xl mx-auto w-full">
                <div className="rounded-2xl bg-gradient-to-br from-[#1a2847] to-[#0f1729] border border-cyan-500/30 p-4 sm:p-8 shadow-2xl">
                  <div className="space-y-4">
                    {walletAddresses.map((address, index) => (
                      <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => updateWalletAddress(index, e.target.value)}
                          placeholder={`Wallet address ${index + 1}`}
                          className="flex-1 px-4 py-3 bg-[#111c3a] border border-cyan-500/30 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {walletAddresses.length > 1 ? (
                          <button
                            onClick={() => removeWallet(index)}
                            className="px-4 py-3 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        ) : (
                          <div className="w-[86px]" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={addWallet}
                      className="flex-1 px-6 py-3 bg-[#1a2847] hover:bg-[#243555] border border-cyan-500/30 text-cyan-300 rounded-lg font-medium transition-colors"
                    >
                      + Add wallet
                    </button>
                    <button
                      onClick={() => fetchRewards()}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-cyan-600 hover:from-orange-500 hover:to-cyan-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Updating..." : rewards && rewards.length > 0 ? "Update" : "Where things stand"}
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  {duplicateWarning && <p className="text-red-400 text-sm">{duplicateWarning}</p>}

                  <div className="mt-8 pt-8 border-t border-cyan-500/20">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Save Section */}
                      <div>
                        <h3 className="text-lg text-slate-200 mb-3">Save current wallets</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={savedName}
                            onChange={(e) => setSavedName(e.target.value)}
                            placeholder="e.g. elephant"
                            className="flex-1 px-4 py-2 bg-[#111c3a] border border-cyan-500/30 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            onKeyDown={(e) => e.key === "Enter" && saveWalletList()}
                          />
                          <button
                            onClick={saveWalletList}
                            className="px-6 py-2 bg-green-900/40 hover:bg-green-900/60 text-green-300 rounded-lg transition-colors font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Load Section */}
                      <div>
                        <h3 className="text-lg text-slate-200 mb-3">Load saved wallets</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={loadName}
                            onChange={(e) => setLoadName(e.target.value)}
                            placeholder="e.g. elephant"
                            className="flex-1 px-4 py-2 bg-[#111c3a] border border-cyan-500/30 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            onKeyDown={(e) => e.key === "Enter" && loadWallets()}
                          />
                          <button
                            onClick={() => loadWallets()}
                            className="px-6 py-2 bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300 rounded-lg transition-colors font-medium"
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    </div>

                    {saveMessage && <div className="mt-4 text-center text-sm text-cyan-300">{saveMessage}</div>}
                  </div>
                </div>
                {/* Rewards Display */}
                {rewards && rewards.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {rewards.length > 0 && 
                     (rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0) > 0 || 
                      rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0) > 0) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 mb-4"
                      >
                        <div className="space-y-3">
                          {/* Total Value */}
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-base">Total value:</span>
                            <span className="text-base font-normal">
                              {tokenPrices.opus > 0 && tokenPrices.coda > 0 ? (
                                <>
                                  $
                                  {formatWithCommas(
                                    formatDecimals(
                                      (
                                        rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0) *
                                          tokenPrices.opus +
                                        rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0) *
                                          tokenPrices.coda
                                      ).toString(),
                                      2,
                                    ),
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-500">Loading...</span>
                              )}
                            </span>
                          </div>

                          {/* Total Opus Holdings */}
                          {rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0) > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="text-base">Total Opus holdings:</span>
                              <span className="text-base font-normal">
                                {formatWithCommas(
                                  rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0).toString(),
                                  0,
                                )}
                                {tokenPrices.opus > 0 && (
                                  <span className="text-slate-400">
                                    {" "}
                                    ($
                                    {formatWithCommas(
                                      formatDecimals(
                                        (
                                          rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0) *
                                          tokenPrices.opus
                                        ).toString(),
                                        2,
                                      ),
                                    )}
                                    )
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Total Coda Holdings */}
                          {rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0) > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="text-base">Total Coda holdings:</span>
                              <span className="text-base font-normal">
                                {formatWithCommas(
                                  rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0).toString(),
                                  0,
                                )}
                                {tokenPrices.coda > 0 && (
                                  <span className="text-slate-400">
                                    {" "}
                                    ($
                                    {formatWithCommas(
                                      formatDecimals(
                                        (
                                          rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0) *
                                          tokenPrices.coda
                                        ).toString(),
                                        2,
                                      ),
                                    )}
                                    )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )}

                          {/* Total accumulated rewards section */}
                          {totalRewards && rewards.length > 0 && 
                           (rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0) > 0 || 
                            rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0) > 0) && (
                            <div className="border-t border-slate-700/50 pt-4 mt-4 space-y-4">
                              {/* Total accumulated rewards */}
                              <div className="flex justify-between items-center text-slate-300">
                                <span className="text-base font-medium">Total accumulated rewards:</span>
                                <span className="text-base font-medium">
                                  {tokenPrices.missor > 0 &&
                                  tokenPrices.finvesta > 0 &&
                                  tokenPrices.wgpp > 0 &&
                                  tokenPrices.weth > 0 &&
                                  tokenPrices.Pwbtc > 0 &&
                                  tokenPrices.plsx > 0 ? (
                                    <>
                                      ${formatWithCommas(formatDecimals(totalAccumulatedValue.toString(), 2))}{" "}
                                      <span className="text-slate-500 text-sm">({percentage.toFixed(1)}%)</span>
                                    </>
                                  ) : (
                                    <span className="text-slate-500">Loading...</span>
                                  )}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Accumulated Opus rewards */}
                                <div className="space-y-2 md:border-r md:border-slate-700/30 md:pr-6">
                                  <div className="flex justify-between items-center text-slate-300">
                                    <span className="text-base font-medium text-orange-400">
                                      Accumulated Opus rewards:
                                    </span>
                                    <span className="text-base font-medium">
                                      {tokenPrices.missor > 0 && tokenPrices.finvesta > 0 && tokenPrices.wgpp > 0 && (
                                        <>
                                          $
                                          {formatWithCommas(
                                            formatDecimals(
                                              (
                                                Number.parseFloat(totalRewards.opus.missor) * tokenPrices.missor +
                                                Number.parseFloat(totalRewards.opus.finvesta) * tokenPrices.finvesta +
                                                Number.parseFloat(totalRewards.opus.wgpp) * tokenPrices.wgpp
                                              ).toString(),
                                              2,
                                            ),
                                          )}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <div className="pl-2 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">Missor:</span>
                                      <span className="text-slate-300">
                                        {formatWithCommas(totalRewards.opus.missor)}
                                        {tokenPrices.missor > 0 && (
                                          <span className="text-slate-500 text-xs ml-2">
                                            ($
                                            {formatDecimals(
                                              (
                                                Number.parseFloat(totalRewards.opus.missor) * tokenPrices.missor
                                              ).toString(),
                                              2,
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">Finvesta:</span>
                                      <span className="text-slate-300">
                                        {formatWithCommas(formatDecimals(totalRewards.opus.finvesta, 2))}
                                        {tokenPrices.finvesta > 0 && (
                                          <span className="text-slate-500 text-xs ml-2">
                                            ($
                                            {formatDecimals(
                                              (
                                                Number.parseFloat(totalRewards.opus.finvesta) * tokenPrices.finvesta
                                              ).toString(),
                                              2,
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">WGPP:</span>
                                      <span className="text-slate-300">
                                        {formatWithCommas(formatDecimals(totalRewards.opus.wgpp, 2))}
                                        {tokenPrices.wgpp > 0 && (
                                          <span className="text-slate-500 text-xs ml-2">
                                            ($
                                            {formatDecimals(
                                              (Number.parseFloat(totalRewards.opus.wgpp) * tokenPrices.wgpp).toString(),
                                              2,
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Accumulated Coda rewards: */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-slate-300">
                                    <span className="text-base font-medium text-cyan-400">
                                      Accumulated Coda rewards
                                    </span>
                                    <span className="text-base font-medium">
                                      {tokenPrices.weth > 0 && tokenPrices.Pwbtc > 0 && tokenPrices.plsx > 0 && (
                                        <>
                                          $
                                          {formatWithCommas(
                                            formatDecimals(
                                              (
                                                Number.parseFloat(totalRewards.coda.weth) * tokenPrices.weth +
                                                Number.parseFloat(totalRewards.coda.Pwbtc) * tokenPrices.Pwbtc +
                                                Number.parseFloat(totalRewards.coda.plsx) * tokenPrices.plsx
                                              ).toString(),
                                              2,
                                            ),
                                          )}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <div className="pl-2 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">WETH:</span>
                                      <span className="text-slate-300">
                                        {formatDecimals(totalRewards.coda.weth, 4)}
                                        {tokenPrices.weth > 0 && (
                                          <span className="text-slate-500 text-xs ml-2">
                                            ($
                                            {formatDecimals(
                                              (Number.parseFloat(totalRewards.coda.weth) * tokenPrices.weth).toString(),
                                              2,
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">pWBTC:</span>
                                      <span className="text-slate-300">
                                        {formatDecimals(totalRewards.coda.Pwbtc, 4)}
                                        {tokenPrices.Pwbtc > 0 && (
                                          <span className="text-slate-500 text-xs ml-2">
                                            ($
                                            {formatDecimals(
                                              (
                                                Number.parseFloat(totalRewards.coda.Pwbtc) * tokenPrices.Pwbtc
                                              ).toString(),
                                              2,
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-400">PLSX:</span>
                                      <span className="text-slate-300">
                                        {formatMillions(totalRewards.coda.plsx, 2)}
                                        {tokenPrices.plsx > 0 && (
                                          <span className="text-slate-500 text-xs ml-2">
                                            ($
                                            {formatDecimals(
                                              (Number.parseFloat(totalRewards.coda.plsx) * tokenPrices.plsx).toString(),
                                              2,
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Individual wallet rewards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rewards
                        .filter(w => Number.parseFloat(w.holdings.opus) > 0 || Number.parseFloat(w.holdings.coda) > 0)
                        .map((walletRewards, index) => (
                        <div
                          key={index}
                          className="rounded-2xl bg-[#111c3a] border border-slate-700/50 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleWallet(index)}
                            className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                          >
                            <h3 className="text-sm font-medium text-slate-200 font-mono">
                              {walletRewards.address.slice(0, 6)}...{walletRewards.address.slice(-4)}
                            </h3>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                expandedWallets.has(index) ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {expandedWallets.has(index) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                                  {/* Holdings Section */}
                                  <div className="space-y-1.5 mb-3">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-slate-300">Opus holdings:</span>
                                      <span className="text-slate-100 font-medium">
                                        {formatMillions(Number.parseFloat(walletRewards.holdings.opus), 2)}
                                        {tokenPrices?.opus > 0 && (
                                          <span className="text-slate-400 text-xs ml-1.5">
                                            ($
                                            {formatWithCommas(
                                              (
                                                Number.parseFloat(walletRewards.holdings.opus) * tokenPrices.opus
                                              ).toFixed(2),
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-slate-300">Coda holdings:</span>
                                      <span className="text-slate-100 font-medium">
                                        {formatMillions(Number.parseFloat(walletRewards.holdings.coda), 2)}
                                        {tokenPrices?.coda > 0 && (
                                          <span className="text-slate-400 text-xs ml-1.5">
                                            ($
                                            {formatWithCommas(
                                              (
                                                Number.parseFloat(walletRewards.holdings.coda) * tokenPrices.coda
                                              ).toFixed(2),
                                            )}
                                            )
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    {tokenPrices?.opus > 0 && tokenPrices?.coda > 0 && (
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-300 font-medium">Total value:</span>
                                        <span className="text-slate-100 font-semibold">
                                          $
                                          {formatWithCommas(
                                            (
                                              Number.parseFloat(walletRewards.holdings.opus) * tokenPrices.opus +
                                              Number.parseFloat(walletRewards.holdings.coda) * tokenPrices.coda
                                            ).toFixed(2),
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Opus Rewards Section */}
                                  <div className="border-t border-slate-700/50 pt-2.5 mb-2.5">
                                    <h4 className="text-xs font-medium mb-1.5 text-orange-300">Opus Rewards</h4>
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between items-start gap-3">
                                        <span className="text-slate-300 text-xs flex-shrink-0">Missor:</span>
                                        <div className="text-right flex-shrink-0">
                                          <div className="text-slate-100 font-medium whitespace-nowrap text-xs">
                                            {formatMillions(walletRewards.opus.missor)}
                                          </div>
                                          {tokenPrices.missor > 0 && (
                                            <div className="text-slate-400 text-xs whitespace-nowrap">
                                              $
                                              {formatDecimals(
                                                (
                                                  Number.parseFloat(walletRewards.opus.missor) * tokenPrices.missor
                                                ).toString(),
                                                2,
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-start gap-3">
                                        <span className="text-slate-300 text-xs flex-shrink-0">Finvesta:</span>
                                        <div className="text-right flex-shrink-0">
                                          <div className="text-slate-100 font-medium whitespace-nowrap text-xs">
                                            {formatDecimals(walletRewards.opus.finvesta, 2)}
                                          </div>
                                          {tokenPrices.finvesta > 0 && (
                                            <div className="text-slate-400 text-xs whitespace-nowrap">
                                              $
                                              {formatDecimals(
                                                (
                                                  Number.parseFloat(walletRewards.opus.finvesta) * tokenPrices.finvesta
                                                ).toString(),
                                                2,
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-start gap-3">
                                        <span className="text-slate-300 text-xs flex-shrink-0">WGPP:</span>
                                        <div className="text-right flex-shrink-0">
                                          <div className="text-slate-100 font-medium whitespace-nowrap text-xs">
                                            {formatDecimals(walletRewards.opus.wgpp, 2)}
                                          </div>
                                          {tokenPrices.wgpp > 0 && (
                                            <div className="text-slate-400 text-xs whitespace-nowrap">
                                              $
                                              {formatDecimals(
                                                (
                                                  Number.parseFloat(walletRewards.opus.wgpp) * tokenPrices.wgpp
                                                ).toString(),
                                                2,
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="border-t border-slate-700/50 pt-1.5 mt-1.5">
                                        <div className="flex justify-between items-start gap-3">
                                          <span className="text-orange-300 text-xs flex-shrink-0 font-medium">
                                            Total:
                                          </span>
                                          <div className="text-right flex-shrink-0">
                                            {tokenPrices.missor > 0 &&
                                              tokenPrices.finvesta > 0 &&
                                              tokenPrices.wgpp > 0 && (
                                                <div className="text-orange-200 font-semibold whitespace-nowrap text-xs">
                                                  $
                                                  {formatDecimals(
                                                    (
                                                      Number.parseFloat(walletRewards.opus.missor) *
                                                        tokenPrices.missor +
                                                      Number.parseFloat(walletRewards.opus.finvesta) *
                                                        tokenPrices.finvesta +
                                                      Number.parseFloat(walletRewards.opus.wgpp) * tokenPrices.wgpp
                                                    ).toString(),
                                                    2,
                                                  )}
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Coda Rewards Section */}
                                  <div className="border-t border-slate-700/50 pt-2.5">
                                    <h4 className="text-xs font-medium mb-1.5 text-cyan-300">Coda Rewards</h4>
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between items-start gap-3">
                                        <span className="text-slate-300 text-xs flex-shrink-0">WETH:</span>
                                        <div className="text-right flex-shrink-0">
                                          <div className="text-slate-100 font-medium whitespace-nowrap text-xs">
                                            {formatDecimals(walletRewards.coda.weth, 4)}
                                          </div>
                                          {tokenPrices.weth > 0 && (
                                            <div className="text-slate-400 text-xs whitespace-nowrap">
                                              $
                                              {formatDecimals(
                                                (
                                                  Number.parseFloat(walletRewards.coda.weth) * tokenPrices.weth
                                                ).toString(),
                                                2,
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-start gap-3">
                                        <span className="text-slate-300 text-xs flex-shrink-0">pWBTC:</span>
                                        <div className="text-right flex-shrink-0">
                                          <div className="text-slate-100 font-medium whitespace-nowrap text-xs">
                                            {formatDecimals(walletRewards.coda.Pwbtc, 4)}
                                          </div>
                                          {tokenPrices.Pwbtc > 0 && (
                                            <div className="text-slate-400 text-xs whitespace-nowrap">
                                              $
                                              {formatDecimals(
                                                (
                                                  Number.parseFloat(walletRewards.coda.Pwbtc) * tokenPrices.Pwbtc
                                                ).toString(),
                                                2,
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-start gap-3">
                                        <span className="text-slate-300 text-xs flex-shrink-0">PLSX:</span>
                                        <div className="text-right flex-shrink-0">
                                          <div className="text-slate-100 font-medium whitespace-nowrap text-xs">
                                            {formatMillions(walletRewards.coda.plsx, 2)}
                                          </div>
                                          {tokenPrices.plsx > 0 && (
                                            <div className="text-slate-400 text-xs whitespace-nowrap">
                                              $
                                              {formatDecimals(
                                                (
                                                  Number.parseFloat(walletRewards.coda.plsx) * tokenPrices.plsx
                                                ).toString(),
                                                2,
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="border-t border-slate-700/50 pt-1.5 mt-1.5">
                                        <div className="flex justify-between items-start gap-3">
                                          <span className="text-cyan-300 text-xs flex-shrink-0 font-medium">
                                            Total:
                                          </span>
                                          <div className="text-right flex-shrink-0">
                                            {tokenPrices.weth > 0 && tokenPrices.Pwbtc > 0 && tokenPrices.plsx > 0 && (
                                              <div className="text-cyan-200 font-semibold whitespace-nowrap text-xs">
                                                $
                                                {formatDecimals(
                                                  (
                                                    Number.parseFloat(walletRewards.coda.weth) * tokenPrices.weth +
                                                    Number.parseFloat(walletRewards.coda.Pwbtc) * tokenPrices.Pwbtc +
                                                    Number.parseFloat(walletRewards.coda.plsx) * tokenPrices.plsx
                                                  ).toString(),
                                                  2,
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.section>

            {/* Main tokens Display */}
            {(tokenBalances.pls > 0 || tokenBalances.plsx > 0 || tokenBalances.inc > 0 || tokenBalances.pHex > 0 || tokenBalances.eHexFromEthereum > 0 || tokenBalances.eHex > 0 || tokenBalances.pWbtc > 0 || tokenBalances.smaug > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-slate-700/50 p-6"
              >
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Main tokens</h3>
                <div className="space-y-2">
                  {tokenBalances.pls > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        PLS — {tokenBalances.pls.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {tokenPricesAll.pls > 0 ? `$${(tokenBalances.pls * tokenPricesAll.pls).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {tokenBalances.plsx > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        PLSX — {tokenBalances.plsx.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {tokenPricesAll.plsx > 0 ? `$${(tokenBalances.plsx * tokenPricesAll.plsx).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {tokenBalances.inc > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        INC — {tokenBalances.inc.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {tokenPricesAll.inc > 0 ? `$${(tokenBalances.inc * tokenPricesAll.inc).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {tokenBalances.pHex > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        pHEX — {tokenBalances.pHex.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {hexPricePulsechain > 0 ? `$${(tokenBalances.pHex * hexPricePulsechain).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {tokenBalances.eHexFromEthereum > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        HEX from Ethereum — {tokenBalances.eHexFromEthereum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {hexPriceEthereum > 0 ? `$${(tokenBalances.eHexFromEthereum * hexPriceEthereum).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {tokenBalances.eHex > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        eHEX — {tokenBalances.eHex.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {hexPriceEthereum > 0 ? `$${(tokenBalances.eHex * hexPriceEthereum).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {tokenBalances.pWbtc > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        pWBTC — {tokenBalances.pWbtc.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {tokenPricesAll.wbtc > 0 ? `$${(tokenBalances.pWbtc * tokenPricesAll.wbtc).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        Opus — {rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {tokenPrices.opus > 0 ? `$${(rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.opus), 0) * tokenPrices.opus).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        Coda — {rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {tokenPrices.coda > 0 ? `$${(rewards.reduce((sum, w) => sum + Number.parseFloat(w.holdings.coda), 0) * tokenPrices.coda).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                  {tokenBalances.smaug > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                      <span className="text-sm text-slate-300">
                        Smaug — {tokenBalances.smaug.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        {smaugPrice > 0 ? `$${(tokenBalances.smaug * smaugPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* HEX Stakes Cards - Separated by Chain */}
            {hexStakes.filter(s => s.chain === "Pulsechain").length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-slate-700/50 p-6"
              >
                <button
                  type="button"
                  onClick={() => toggleStakeCard("hex-pls")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-slate-100">HEX Stakes (Pulsechain)</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400">
                      {(() => {
                        const stakes = hexStakes.filter(s => s.chain === "Pulsechain")
                        const totalHex = stakes.reduce((sum, s) => sum + s.stakedHearts, 0)
                        const totalTShares = stakes.reduce((sum, s) => sum + s.stakeShares, 0)
                        const totalValue = totalHex * hexPricePulsechain
                        const avgLength = Math.round(stakes.reduce((sum, s) => sum + s.stakedDays, 0) / stakes.length)
                        return `${totalTShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares | ${stakes.length} stake${stakes.length > 1 ? "s" : ""} | Avg: ${avgLength} days | ${totalHex.toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX${hexPricePulsechain > 0 ? ` / $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ""}`
                      })()}
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${expandedStakeCards.has("hex-pls") ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedStakeCards.has("hex-pls") && (
                  <div className="space-y-2 mt-4">
                    {hexStakes.filter(s => s.chain === "Pulsechain").map((stake, idx) => {
                      const usdValue = stake.stakedHearts * hexPricePulsechain
                      return (
                        <div
                          key={`${stake.wallet}-${stake.stakeId}-${idx}`}
                          className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0"
                        >
                          <span className="text-sm text-slate-300">
                            Day {stake.daysPassed}/{stake.stakedDays} ({stake.daysRemaining} days left) — {stake.stakedHearts.toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX — {stake.stakeShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares — {stake.wallet.slice(0, 4)}…{stake.wallet.slice(-4)}
                          </span>
                          <span className={`text-sm font-medium ${stake.isActive ? "text-green-400" : "text-slate-400"}`}>
                            {hexPricePulsechain > 0 ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {hexStakes.filter(s => s.chain === "Ethereum").length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-slate-700/50 p-6"
              >
                <button
                  type="button"
                  onClick={() => toggleStakeCard("hex-eth")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-slate-100">HEX Stakes (Ethereum)</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400">
                      {(() => {
                        const stakes = hexStakes.filter(s => s.chain === "Ethereum")
                        const totalHex = stakes.reduce((sum, s) => sum + s.stakedHearts, 0)
                        const totalTShares = stakes.reduce((sum, s) => sum + s.stakeShares, 0)
                        const totalValue = totalHex * hexPriceEthereum
                        const avgLength = Math.round(stakes.reduce((sum, s) => sum + s.stakedDays, 0) / stakes.length)
                        return `${totalTShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares | ${stakes.length} stake${stakes.length > 1 ? "s" : ""} | Avg: ${avgLength} days | ${totalHex.toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX${hexPriceEthereum > 0 ? ` / $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ""}`
                      })()}
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${expandedStakeCards.has("hex-eth") ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedStakeCards.has("hex-eth") && (
                  <div className="space-y-2 mt-4">
                    {hexStakes.filter(s => s.chain === "Ethereum").map((stake, idx) => {
                      const usdValue = stake.stakedHearts * hexPriceEthereum
                      return (
                        <div
                          key={`${stake.wallet}-${stake.stakeId}-${idx}`}
                          className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0"
                        >
                          <span className="text-sm text-slate-300">
                            Day {stake.daysPassed}/{stake.stakedDays} ({stake.daysRemaining} days left) — {stake.stakedHearts.toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX — {stake.stakeShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares — {stake.wallet.slice(0, 4)}…{stake.wallet.slice(-4)}
                          </span>
                          <span className={`text-sm font-medium ${stake.isActive ? "text-green-400" : "text-slate-400"}`}>
                            {hexPriceEthereum > 0 ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* HSI Stakes Cards - Separated by Chain */}
            {hsiStakes.filter(s => s.chain === "Pulsechain").length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-slate-700/50 p-6"
              >
                <button
                  type="button"
                  onClick={() => toggleStakeCard("hsi-pls")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-slate-100">HSI Stakes (Pulsechain)</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400">
                      {(() => {
                        const stakes = hsiStakes.filter(s => s.chain === "Pulsechain")
                        const totalHex = stakes.reduce((sum, s) => sum + s.stakedHearts, 0)
                        const totalTShares = stakes.reduce((sum, s) => sum + s.stakeShares, 0)
                        const totalValue = totalHex * hexPricePulsechain
                        const avgLength = Math.round(stakes.reduce((sum, s) => sum + s.stakedDays, 0) / stakes.length)
                        return `${totalTShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares | ${stakes.length} HSI${stakes.length > 1 ? "s" : ""} | Avg: ${avgLength} days | ${totalHex.toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX${hexPricePulsechain > 0 ? ` / $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ""}`
                      })()}
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${expandedStakeCards.has("hsi-pls") ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedStakeCards.has("hsi-pls") && (
                  <div className="space-y-2 mt-4">
                    {hsiStakes.filter(s => s.chain === "Pulsechain").map((stake, idx) => {
                      const usdValue = stake.stakedHearts * hexPricePulsechain
                      return (
                        <div
                          key={`${stake.wallet}-${stake.stakeId}-${idx}`}
                          className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0"
                        >
                          <span className="text-sm text-slate-300">
                            Day {stake.daysPassed}/{stake.stakedDays} ({stake.daysRemaining} days left) — {stake.stakedHearts.toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX — {stake.stakeShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares{stake.isAutoStake ? " (Auto)" : ""} — {stake.wallet.slice(0, 4)}…{stake.wallet.slice(-4)}
                          </span>
                          <span className={`text-sm font-medium ${stake.isActive ? "text-green-400" : "text-slate-400"}`}>
                            {hexPricePulsechain > 0 ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {hsiStakes.filter(s => s.chain === "Ethereum").length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-slate-700/50 p-6"
              >
                <button
                  type="button"
                  onClick={() => toggleStakeCard("hsi-eth")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-slate-100">HSI Stakes (Ethereum)</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400">
                      {(() => {
                        const stakes = hsiStakes.filter(s => s.chain === "Ethereum")
                        const totalHex = stakes.reduce((sum, s) => sum + s.stakedHearts, 0)
                        const totalTShares = stakes.reduce((sum, s) => sum + s.stakeShares, 0)
                        const totalValue = totalHex * hexPriceEthereum
                        const avgLength = Math.round(stakes.reduce((sum, s) => sum + s.stakedDays, 0) / stakes.length)
                        return `${totalTShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares | ${stakes.length} HSI${stakes.length > 1 ? "s" : ""} | Avg: ${avgLength} days | ${totalHex.toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX${hexPriceEthereum > 0 ? ` / $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ""}`
                      })()}
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${expandedStakeCards.has("hsi-eth") ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedStakeCards.has("hsi-eth") && (
                  <div className="space-y-2 mt-4">
                    {hsiStakes.filter(s => s.chain === "Ethereum").map((stake, idx) => {
                      const usdValue = stake.stakedHearts * hexPriceEthereum
                      return (
                        <div
                          key={`${stake.wallet}-${stake.stakeId}-${idx}`}
                          className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0"
                        >
                          <span className="text-sm text-slate-300">
                            Day {stake.daysPassed}/{stake.stakedDays} ({stake.daysRemaining} days left) — {stake.stakedHearts.toLocaleString(undefined, { maximumFractionDigits: 0 })} HEX — {stake.stakeShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares{stake.isAutoStake ? " (Auto)" : ""} — {stake.wallet.slice(0, 4)}…{stake.wallet.slice(-4)}
                          </span>
                          <span className={`text-sm font-medium ${stake.isActive ? "text-green-400" : "text-slate-400"}`}>
                            {hexPriceEthereum > 0 ? `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

{/* Liquid Loans Display */}
            {liquidLoansVaults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-slate-700/50 p-6"
              >
                <button
                  type="button"
                  onClick={() => toggleStakeCard("liquid-loans")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-slate-100">Liquid Loans vaults</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400">
                      Total collateral: {liquidLoansVaults.reduce((sum, v) => sum + v.lockedPLS, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS | Total Debt: {liquidLoansVaults.reduce((sum, v) => sum + v.debt, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDL
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${expandedStakeCards.has("liquid-loans") ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedStakeCards.has("liquid-loans") && (
                  <div className="space-y-2 mt-4">
                    {liquidLoansVaults.map((vault, idx) => (
                      <div
                        key={`${vault.wallet}-${idx}`}
                        className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0"
                      >
                        <span className="text-sm text-slate-300">
                          {vault.wallet.slice(0, 6)}...{vault.wallet.slice(-4)} — Collateral: {vault.lockedPLS.toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS
                        </span>
                        <span className="text-sm font-medium text-green-400">
                          Debt: {vault.debt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDL
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            <div className="text-center space-y-8 mt-8">
              <h2 className="text-2xl md:text-3xl text-slate-200 font-medium">
                Have you decided how many of each to own?
              </h2>
              <div className="flex flex-col md:flex-row justify-center items-center gap-12">
                <Link
                  href="https://ipfs.app.pulsex.com?outputCurrency=0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300"
                >
                  <Image
                    src="/opus.jpg"
                    alt="Opus logo"
                    width={192}
                    height={192}
                    className="w-48 h-48 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-shadow duration-300"
                  />
                  <span className="text-xl font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors">
                    Buy Opus
                  </span>
                </Link>
                <Link
                  href="https://ipfs.app.pulsex.com?outputCurrency=0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300"
                >
                  <Image
                    src="/coda1.jpg"
                    alt="Coda logo"
                    width={192}
                    height={192}
                    className="w-48 h-48 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-shadow duration-300"
                  />
                  <span className="text-xl font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors">
                    Buy Coda
                  </span>
                </Link>
                <Link
                  href="https://ipfs.app.pulsex.com/?inputCurrency=0xA1077a294dDE1B09bB078844df40758a5D0f9a27&outputCurrency=0xf4754Aa585caBf38537A68660469A17E203D8632"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300"
                >
                  <Image
                    src="/smaug.jpg"
                    alt="Smaug logo"
                    width={192}
                    height={192}
                    className="w-48 h-48 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-shadow duration-300"
                  />
                  <span className="text-xl font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors">
                    Buy Smaug
                  </span>
                </Link>
              </div>
            </div>
            <div>
              <p className="text-slate-200 text-sm mb-4 text-center">Contract addresses</p>
              <div className="space-y-3 text-cyan-300 text-base text-center">
                {[
                  { name: "Opus", address: "0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4" },
                  { name: "Coda", address: "0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7" },
                  { name: "Smaug", address: "0xf4754Aa585caBf38537A68660469A17E203D8632" },
                ].map((token) => (
                  <div key={token.name} className="flex items-center justify-center gap-2">
                    <Link
                      href={`https://otter.pulsechain.com/address/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-cyan-200 transition"
                    >
                      {token.name}: {token.address}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(token.address)
                        setCopiedAddress(token.address)
                        setTimeout(() => setCopiedAddress(null), 2000)
                      }}
                      className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                      title={`Copy ${token.name} address`}
                    >
                      {copiedAddress === token.address ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-slate-400 hover:text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-8">
              <Link href="https://x.com/OpusEco" target="_blank" rel="noopener noreferrer" className="group">
                <div className="w-14 h-14 rounded-full bg-[#111c3a] border border-blue-900/30 flex items-center justify-center hover:bg-blue-900/30 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20">
                  <svg
                    className="w-6 h-6 text-slate-400 group-hover:text-cyan-300 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              </Link>
              <Link href="https://t.me/opus_official" target="_blank" rel="noopener noreferrer" className="group">
                <div className="w-14 h-14 rounded-full bg-[#111c3a] border border-blue-900/30 flex items-center justify-center hover:bg-blue-900/30 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20">
                  <svg
                    className="w-6 h-6 text-slate-400 group-hover:text-cyan-300 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Telegram"
                  >
                    <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
                  </svg>
                </div>
              </Link>
              <Link
                href="https://www.youtube.com/@opustoken"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="w-14 h-14 rounded-full bg-[#111c3a] border border-blue-900/30 flex items-center justify-center hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20">
                  <svg
                    className="w-7 h-7 text-slate-400 group-hover:text-red-400 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="YouTube"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              </Link>
            </div>
            <p className="text-center text-slate-600 text-xs tracking-wide mt-6">© since deployment</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
