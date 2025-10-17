"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { ethers } from "ethers"
import { savePortfolio, loadPortfolio } from "./actions"
import PortfolioCard from "@/components/portfolio-card"
import { fetchPulseAssets, fetchLPPositions } from "@/lib/fetch-live-data"
import ValidatorInfo from "@/components/validator-info" // Import ValidatorInfo

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

const FEATURED_TOKENS = [
  {
    address: "0x95b303987a60c71504d99aa1b13b4da07b0790ab",
    symbol: "PLSX",
    name: "PLSX",
    logo: "https://gopulse.com/img/coins/PLSX.svg", // Using GoPulse logo
  },
  {
    address: "0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c",
    symbol: "WETH",
    name: "Wrapped Ethereum",
    logo: "https://gopulse.com/img/coins/WETH.svg", // Using GoPulse logo
  },
  {
    address: "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39",
    symbol: "HEX",
    name: "HEX (PulseChain)",
    logo: "https://gopulse.com/img/coins/HEX.svg", // Using GoPulse logo for HEX
  },
  {
    address: "0x57fde0a71132198BBeC939B98976993d8D89D225",
    symbol: "eHEX",
    name: "HEX (from Ethereum)",
    logo: "https://gopulse.com/img/coins/eHEX.svg", // Using GoPulse logo for eHEX
  },
  {
    address: "0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d",
    symbol: "INC",
    name: "Incentive",
    logo: "https://gopulse.com/img/coins/INC.svg", // Using GoPulse logo
  },
]

const PLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27" // Wrapped PLS address for price lookup

const HEX_PULSECHAIN_ADDRESS = "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39"
const HEX_ETHEREUM_ADDRESS = "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39"

const HEX_STAKING_ABI = [
  "function stakeCount(address) view returns (uint256)",
  "function stakeLists(address, uint256) view returns (uint40 stakeId, uint72 stakedHearts, uint72 stakeShares, uint16 lockedDay, uint16 stakedDays, uint16 unlockedDay, bool isAutoStake)",
  "function currentDay() view returns (uint256)",
]

const VALIDATOR_DEPOSIT_ABI = [
  "event DepositEvent(bytes pubkey, bytes withdrawal_credentials, bytes amount, bytes signature, bytes index)",
  "function get_deposit_count() view returns (bytes)",
]

const PULSECHAIN_DEPOSIT_CONTRACT = "0x3693693693693693693693693693693693693693"

const getDecimalPlaces = (symbol: string): number => {
  const upperSymbol = symbol.toUpperCase()
  if (upperSymbol === "WETH") return 4
  if (["HEX", "EHEX", "PLSX", "PLS"].includes(upperSymbol)) return 0
  return 2 // default for other tokens
}

const fetchINCPrice = async (plsUsdPrice: number): Promise<number> => {
  try {
    const INC_WPLS_PAIR = "0xf808bb6265e9ca27002c0a04562bf50d4fe37eaa" // INC/WPLS pair on PulseX
    const PAIR_ABI = [
      "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    ]

    const provider = new ethers.JsonRpcProvider("https://rpc.pulsechain.com")
    const pairContract = new ethers.Contract(INC_WPLS_PAIR, PAIR_ABI, provider)

    const reserves = await pairContract.getReserves()
    const reserveINC = Number(ethers.formatUnits(reserves.reserve0, 18)) // INC is reserve0
    const reserveWPLS = Number(ethers.formatUnits(reserves.reserve1, 18)) // WPLS is reserve1

    const incPriceInPLS = reserveWPLS / reserveINC
    const incUsdPrice = incPriceInPLS * plsUsdPrice

    console.log(`[v0] INC price from DEX: $${incUsdPrice.toFixed(4)}`)
    return incUsdPrice
  } catch (error) {
    console.error("[v0] Error fetching INC price from DEX:", error)
    return 0
  }
}

const fetchTokenPrices = async (
  tokenAddresses: string[],
): Promise<{ prices: Record<string, number>; changes: Record<string, number> }> => {
  try {
    const prices: Record<string, number> = {}
    const changes: Record<string, number> = {}

    let plsUsdPrice = 0
    try {
      console.log(`[v0] Fetching PLS price for INC calculation`)
      const plsResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/pulsechain?contract_addresses=${PLS_ADDRESS}&vs_currencies=usd&include_24hr_change=true`,
      )
      const plsData = await plsResponse.json()
      if (plsData[PLS_ADDRESS.toLowerCase()]?.usd) {
        plsUsdPrice = plsData[PLS_ADDRESS.toLowerCase()].usd
        prices[PLS_ADDRESS.toLowerCase()] = plsUsdPrice
        changes[PLS_ADDRESS.toLowerCase()] = plsData[PLS_ADDRESS.toLowerCase()].usd_24h_change || 0
        console.log(`[v0] PLS price: $${plsUsdPrice}, 24h change: ${changes[PLS_ADDRESS.toLowerCase()]}%`)
      }
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (err) {
      console.error(`[v0] Error fetching PLS price:`, err)
    }

    // Fetch prices one by one to avoid CoinGecko free tier limit
    for (const address of tokenAddresses) {
      if (address.toLowerCase() === PLS_ADDRESS.toLowerCase()) continue

      if (address.toLowerCase() === "0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d") {
        if (plsUsdPrice > 0) {
          const incPrice = await fetchINCPrice(plsUsdPrice)
          if (incPrice > 0) {
            prices[address.toLowerCase()] = incPrice
            changes[address.toLowerCase()] = 0 // No 24h change data from DEX
          }
        }
        continue
      }

      try {
        console.log(`[v0] Fetching price for ${address}`)
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/token_price/pulsechain?contract_addresses=${address}&vs_currencies=usd&include_24hr_change=true`,
        )
        const data = await response.json()

        if (data[address.toLowerCase()]?.usd) {
          prices[address.toLowerCase()] = data[address.toLowerCase()].usd
          changes[address.toLowerCase()] = data[address.toLowerCase()].usd_24h_change || 0
          console.log(
            `[v0] Price for ${address}: $${data[address.toLowerCase()].usd}, 24h change: ${changes[address.toLowerCase()]}%`,
          )
        }

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (err) {
        console.error(`[v0] Error fetching price for ${address}:`, err)
      }
    }

    console.log("[v0] All prices fetched:", prices)
    console.log("[v0] All 24h changes fetched:", changes)
    return { prices, changes }
  } catch (error) {
    console.error("[v0] Error fetching token prices:", error)
    return { prices: {}, changes: {} }
  }
}

export default function Home() {
  const searchParams = useSearchParams()
  const [wallets, setWallets] = useState<{ address: string; label?: string }[]>([])
  const [newWallet, setNewWallet] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [tokens, setTokens] = useState<string[]>([])
  const [newToken, setNewToken] = useState("")
  const [data, setData] = useState<any>(null)
  const [lpPositions, setLpPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loadId, setLoadId] = useState("")
  const [saving, setSaving] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [selectedWallets, setSelectedWallets] = useState<string[]>([])
  const [featuredTokenBalances, setFeaturedTokenBalances] = useState<any[]>([])
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({})
  const [tokenPriceChanges, setTokenPriceChanges] = useState<Record<string, number>>({})
  const [hexStakes, setHexStakes] = useState<any[]>([])
  const [validatorPositions, setValidatorPositions] = useState<any[]>([]) // Updated validator positions state to include more comprehensive data
  const [manualValidatorIds, setManualValidatorIds] = useState<string[]>([]) // Added state for manual validator IDs
  const [newValidatorId, setNewValidatorId] = useState("") // Added state for new manual validator ID input
  const [notification, setNotification] = useState<{ message: string; show: boolean }>({ message: "", show: false })

  const priceCache = useRef<{
    prices: Record<string, number>
    changes: Record<string, number>
    timestamp: number
  } | null>(null)
  const PRICE_CACHE_TTL = 60000 // 60 seconds

  const provider = useMemo(() => new ethers.JsonRpcProvider("https://rpc.pulsechain.com"), [])
  const ethereumProvider = useMemo(() => new ethers.JsonRpcProvider("https://eth.llamarpc.com"), [])

  const vaultManager = useMemo(() => {
    const liquidLoansVaultManagerAddress = "0xD79bfb86fA06e8782b401bC0197d92563602D2Ab"
    const liquidLoansAbi = [
      "function getVaultColl(address) view returns (uint256)",
      "function getVaultDebt(address) view returns (uint256)",
    ]
    return new ethers.Contract(liquidLoansVaultManagerAddress, liquidLoansAbi, provider)
  }, [provider])

  useEffect(() => {
    if (wallets.length > 0 && selectedWallets.length === 0) {
      setSelectedWallets(wallets.map((w) => w.address))
    }
  }, [wallets.length])

  const filteredWallets = useMemo(() => {
    if (selectedWallets.length === 0) return wallets
    return wallets.filter((w) => selectedWallets.includes(w.address))
  }, [wallets, selectedWallets])

  useEffect(() => {
    if (filteredWallets.length > 0) {
      fetchData()
    }
  }, [filteredWallets.length, tokens.length])

  const toggleWalletSelection = (address: string) => {
    setSelectedWallets((prev) => {
      if (prev.includes(address)) {
        if (prev.length === 1) return prev
        return prev.filter((a) => a !== address)
      } else {
        return [...prev, address]
      }
    })
  }

  const addWallet = () => {
    if (!ethers.isAddress(newWallet) || wallets.some((w) => w.address.toLowerCase() === newWallet.toLowerCase())) {
      setError("Invalid or duplicate address")
      return
    }
    const updated = [...wallets, { address: newWallet, label: newLabel || "" }]
    setWallets(updated)
    setSelectedWallets((prev) => [...prev, newWallet])
    localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets: updated, tokens }))
    setNewWallet("")
    setNewLabel("")
    setError("")
  }

  const removeWallet = (index: number) => {
    const updated = wallets.filter((_, i) => i !== index)
    const removedAddress = wallets[index].address
    setWallets(updated)
    setSelectedWallets((prev) => prev.filter((a) => a !== removedAddress))
    localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets: updated, tokens }))
  }

  const addToken = () => {
    if (!ethers.isAddress(newToken) || tokens.some((t) => t.toLowerCase() === newToken.toLowerCase())) {
      setError("Invalid or duplicate token address")
      return
    }
    const updated = [...tokens, newToken]
    setTokens(updated)
    localStorage.setItem("tracker_portfolio", JSON.JSON.stringify({ wallets, tokens: updated }))
    setNewToken("")
    setError("")
  }

  const removeToken = (index: number) => {
    const updated = tokens.filter((_, i) => i !== index)
    setTokens(updated)
    localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets, tokens: updated }))
  }

  const addValidatorId = () => {
    const trimmedId = newValidatorId.trim()
    if (!trimmedId || manualValidatorIds.includes(trimmedId)) {
      setError("Invalid or duplicate validator ID")
      return
    }
    const updated = [...manualValidatorIds, trimmedId]
    setManualValidatorIds(updated)
    localStorage.setItem("tracker_validator_ids", JSON.stringify(updated))
    setNewValidatorId("")
    setError("")
  }

  const removeValidatorId = (index: number) => {
    const updated = manualValidatorIds.filter((_, i) => i !== index)
    setManualValidatorIds(updated)
    localStorage.setItem("tracker_validator_ids", JSON.stringify(updated))
  }

  useEffect(() => {
    const saved = localStorage.getItem("tracker_validator_ids")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setManualValidatorIds(parsed)
        }
      } catch (err) {
        console.error("Error loading validator IDs:", err)
      }
    } else {
      setManualValidatorIds(["1"])
    }
  }, [])

  const savePortfolioId = async () => {
    if (wallets.length === 0) {
      setNotification({
        message: "Add at least one wallet first",
        show: true,
      })
      return
    }

    setSaving(true)
    try {
      const result = await savePortfolio(wallets, tokens)

      if (result.success && result.portfolioId) {
        try {
          await navigator.clipboard.writeText(result.portfolioId)
          setNotification({
            message: `Your Portfolio ID ${result.portfolioId} is copied to your clipboard!\n\nUse this ID in any browser to load your wallets!`,
            show: true,
          })
        } catch (clipboardError) {
          console.error("Clipboard error:", clipboardError)
          setNotification({
            message: `Your Portfolio ID: ${result.portfolioId}\n\n(Copy failed - please copy manually)\n\nUse this ID in any browser to load your wallets!`,
            show: true,
          })
        }
      } else {
        setNotification({
          message: `Error: ${result.error || "Failed to save portfolio"}`,
          show: true,
        })
      }
    } catch (error) {
      console.error("Error saving portfolio:", error)
      setNotification({
        message: "Failed to save portfolio. Please try again.",
        show: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const loadPortfolioById = async () => {
    if (!loadId.trim()) {
      setError("Enter a Portfolio ID")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await loadPortfolio(loadId.trim())

      if (result.success && result.wallets) {
        setWallets(result.wallets)
        setTokens(result.tokens || [])
        localStorage.setItem(
          "tracker_portfolio",
          JSON.stringify({ wallets: result.wallets, tokens: result.tokens || [] }),
        )
        setLoadId("")
        setShowLoadModal(false)
        const walletCount = result.wallets.length
        const walletWord = walletCount === 1 ? "wallet has" : "wallets have"
        setNotification({
          message: `${walletCount} ${walletWord} been successfully imported, proving once again that humans are brilliant at collecting things they can't quite touch—bravo!`,
          show: true,
        })
      } else {
        setError(result.error || "Portfolio ID not found")
      }
    } catch (error) {
      console.error("Error loading portfolio:", error)
      setError("Failed to load portfolio. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    if (filteredWallets.length === 0) {
      setError("Add at least one wallet")
      return
    }

    setLoading(true)
    setError("")
    setData(null)
    setLpPositions([])
    setFeaturedTokenBalances([])
    setHexStakes([])
    setValidatorPositions([]) // Reset validator positions

    try {
      let totalPLS = ethers.parseEther("0")
      let totalLockedPLS = ethers.parseEther("0")
      let totalDebt = ethers.parseEther("0")
      const tokenBalances: any[] = []
      const allLPPositions: any[] = []
      const allHexStakes: any[] = []
      const liquidLoansVaults: any[] = []
      const allValidatorPositions: any[] = [] // Added array for validator positions

      const now = Date.now()
      let prices: Record<string, number>
      let changes: Record<string, number>

      if (priceCache.current && now - priceCache.current.timestamp < PRICE_CACHE_TTL) {
        console.log("[v0] Using cached prices")
        prices = priceCache.current.prices
        changes = priceCache.current.changes
      } else {
        console.log("[v0] Fetching fresh prices")
        const addressesToFetch = [PLS_ADDRESS, ...FEATURED_TOKENS.map((t) => t.address)]
        console.log("[v0] Fetching prices for tokens:", addressesToFetch)
        const result = await fetchTokenPrices(addressesToFetch)
        prices = result.prices
        changes = result.changes

        // Cache the prices
        priceCache.current = {
          prices,
          changes,
          timestamp: now,
        }
      }

      console.log("[v0] Setting token prices state:", prices)
      setTokenPrices(prices)
      setTokenPriceChanges(changes)

      const featuredBalances: any[] = []
      for (const featuredToken of FEATURED_TOKENS) {
        try {
          const tokenContract = new ethers.Contract(featuredToken.address, ERC20_ABI, provider)
          const decimals = await tokenContract.decimals()

          let totalBalance = BigInt(0)
          for (const wallet of filteredWallets) {
            const balance = await tokenContract.balanceOf(wallet.address)
            totalBalance += balance
          }

          if (totalBalance > 0) {
            featuredBalances.push({
              ...featuredToken,
              balance: ethers.formatUnits(totalBalance, decimals),
              decimals,
            })
          }
        } catch (err) {
          console.error(`Error fetching featured token ${featuredToken.symbol}:`, err)
        }
      }
      setFeaturedTokenBalances(featuredBalances)

      for (const wallet of filteredWallets) {
        const plsBalance = await provider.getBalance(wallet.address)
        totalPLS = totalPLS + plsBalance

        try {
          const walletTokens = await fetchPulseAssets(wallet.address)
          for (const token of walletTokens) {
            const existing = tokenBalances.find((t) => t.address.toLowerCase() === token.address.toLowerCase())
            if (existing) {
              existing.value += token.value
            } else {
              tokenBalances.push({ ...token })
            }
          }
        } catch (err) {
          console.error(`Error fetching tokens for ${wallet.address}:`, err)
        }

        try {
          const walletLPs = await fetchLPPositions(wallet.address)
          for (const lp of walletLPs) {
            const existing = allLPPositions.find((l) => l.pairId === lp.pairId)
            if (existing) {
              existing.value += lp.value
            } else {
              allLPPositions.push({ ...lp })
            }
          }
        } catch (err) {
          console.error(`Error fetching LP positions for ${wallet.address}:`, err)
        }

        try {
          console.log(`[v0] Checking Liquid Loans vault for wallet: ${wallet.address}`)
          const lockedPLS = await vaultManager.getVaultColl(wallet.address)
          console.log(`[v0] getVaultColl returned:`, lockedPLS.toString())

          const debtUSDL = await vaultManager.getVaultDebt(wallet.address)
          console.log(`[v0] getVaultDebt returned:`, debtUSDL.toString())

          if (lockedPLS > 0 || debtUSDL > 0) {
            liquidLoansVaults.push({
              wallet: wallet.address,
              lockedPLS: ethers.formatEther(lockedPLS),
              debt: ethers.formatEther(debtUSDL),
            })
          }

          totalLockedPLS = totalLockedPLS + lockedPLS
          totalDebt = totalDebt + debtUSDL

          console.log(`[v0] Liquid Loans data fetched successfully for ${wallet.address}`)
        } catch (vaultError: any) {
          console.log(`[v0] Liquid Loans error for ${wallet.address}:`, vaultError.message)
          console.log(`[v0] Error code:`, vaultError.code)
          console.log(`[v0] Full error:`, vaultError)
        }

        try {
          const hexContract = new ethers.Contract(HEX_PULSECHAIN_ADDRESS, HEX_STAKING_ABI, provider)
          const stakeCount = await hexContract.stakeCount(wallet.address)
          const currentDay = await hexContract.currentDay()
          console.log(`[v0] PulseChain HEX stakes for ${wallet.address}: ${stakeCount.toString()}`)

          for (let i = 0; i < Number(stakeCount); i++) {
            try {
              const stake = await hexContract.stakeLists(wallet.address, i)
              const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
              const stakeShares = ethers.formatUnits(stake.stakeShares, 12)

              const daysPassed = Number(currentDay) - Number(stake.lockedDay)
              const daysRemaining = Number(stake.stakedDays) - daysPassed
              const isActive = stake.unlockedDay === 0

              allHexStakes.push({
                wallet: wallet.address,
                chain: "PulseChain",
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
            } catch (err) {
              console.error(`[v0] Error fetching PulseChain HEX stake ${i}:`, err)
            }
          }
        } catch (err) {
          console.log(`[v0] No PulseChain HEX stakes found for ${wallet.address}`)
        }

        try {
          const ETHEREUM_TIMEOUT = 10000 // 10 second timeout

          const fetchEthereumStakes = async () => {
            const hexEthContract = new ethers.Contract(HEX_ETHEREUM_ADDRESS, HEX_STAKING_ABI, ethereumProvider)
            const stakeCount = await hexEthContract.stakeCount(wallet.address)
            const currentDay = await hexEthContract.currentDay()
            console.log(`[v0] Ethereum HEX stakes for ${wallet.address}: ${stakeCount.toString()}`)

            for (let i = 0; i < Number(stakeCount); i++) {
              try {
                const stake = await hexEthContract.stakeLists(wallet.address, i)
                const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
                const stakeShares = ethers.formatUnits(stake.stakeShares, 12)

                const daysPassed = Number(currentDay) - Number(stake.lockedDay)
                const daysRemaining = Number(stake.stakedDays) - daysPassed
                const isActive = stake.unlockedDay === 0

                allHexStakes.push({
                  wallet: wallet.address,
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
              } catch (err) {
                console.error(`[v0] Error fetching Ethereum HEX stake ${i}:`, err)
              }
            }
          }

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Ethereum RPC timeout")), ETHEREUM_TIMEOUT),
          )

          await Promise.race([fetchEthereumStakes(), timeoutPromise])
        } catch (err: any) {
          if (err.message === "Ethereum RPC timeout") {
            console.log(
              `[v0] Ethereum HEX stakes fetch timed out for ${wallet.address} - continuing without Ethereum stakes`,
            )
          } else {
            console.log(`[v0] No Ethereum HEX stakes found for ${wallet.address}`)
          }
        }

        try {
          console.log(`[v0] Fetching validator positions for ${wallet.address}`)

          const VALIDATOR_FETCH_TIMEOUT = 15000 // 15 second timeout
          const MAX_TRANSACTIONS_TO_CHECK = 100 // Limit transactions checked

          const fetchValidatorPositions = async () => {
            const depositContract = new ethers.Contract(PULSECHAIN_DEPOSIT_CONTRACT, VALIDATOR_DEPOSIT_ABI, provider)
            const currentBlock = await provider.getBlockNumber()
            const CHUNK_SIZE = 10000
            const LOOKBACK_BLOCKS = 100000
            const fromBlock = Math.max(0, currentBlock - LOOKBACK_BLOCKS)

            console.log(
              `[v0] Querying deposit events from block ${fromBlock} to ${currentBlock} in chunks of ${CHUNK_SIZE}`,
            )

            const allLogs: any[] = []

            for (let start = fromBlock; start <= currentBlock; start += CHUNK_SIZE) {
              const end = Math.min(start + CHUNK_SIZE - 1, currentBlock)

              try {
                const filter = depositContract.filters.DepositEvent()
                const logs = await provider.getLogs({
                  address: PULSECHAIN_DEPOSIT_CONTRACT,
                  topics: filter.topics,
                  fromBlock: start,
                  toBlock: end,
                })

                allLogs.push(...logs)
                console.log(`[v0] Queried blocks ${start}-${end}: found ${logs.length} deposit events`)
              } catch (chunkError) {
                console.log(`[v0] Error querying blocks ${start}-${end}:`, chunkError)
              }
            }

            console.log(`[v0] Found ${allLogs.length} total deposit events`)

            const logsToCheck = allLogs.slice(0, MAX_TRANSACTIONS_TO_CHECK)
            console.log(`[v0] Checking ${logsToCheck.length} transactions for wallet ${wallet.address}`)

            let checkedCount = 0
            for (const log of logsToCheck) {
              try {
                const tx = await provider.getTransaction(log.transactionHash)
                checkedCount++

                if (checkedCount % 10 === 0) {
                  console.log(`[v0] Checked ${checkedCount}/${logsToCheck.length} transactions`)
                }

                if (tx && tx.from.toLowerCase() === wallet.address.toLowerCase()) {
                  const parsedLog = depositContract.interface.parseLog({
                    topics: log.topics as string[],
                    data: log.data,
                  })

                  if (parsedLog) {
                    const amount = ethers.hexlify(parsedLog.args.amount)
                    const amountInEther = ethers.formatEther(ethers.toBigInt(amount))
                    const validatorIndex = ethers.toBigInt(parsedLog.args.index).toString()

                    console.log(`[v0] Found validator deposit: index ${validatorIndex}, amount ${amountInEther} PLS`)

                    let status = "active"
                    let apr = "—"

                    try {
                      const beaconResponse = await fetch(
                        `https://beacon.g4mm4.io/eth/v1/beacon/states/head/validators/${validatorIndex}`,
                        { headers: { Accept: "application/json" } },
                      )

                      if (beaconResponse.ok) {
                        const beaconData = await beaconResponse.json()
                        status = beaconData.data?.validator?.status || "active"
                        apr = "8.5" // Placeholder - would need rewards calculation
                        console.log(`[v0] Beacon API data fetched for validator ${validatorIndex}: status ${status}`)
                      }
                    } catch (beaconError) {
                      console.log(`[v0] Beacon API unavailable for validator ${validatorIndex}, using defaults`)
                    }

                    allValidatorPositions.push({
                      wallet: wallet.address,
                      validatorIndex,
                      selfStake: amountInEther,
                      delegations: "0",
                      totalStaked: amountInEther,
                      lifetimeRewards: "0",
                      apr,
                      status,
                      timestamp: new Date(log.blockNumber * 12 * 1000).toLocaleDateString(), // Approximate timestamp
                    })
                  }
                }
              } catch (txError) {
                console.log(`[v0] Error processing transaction:`, txError)
              }
            }

            console.log(
              `[v0] Validator positions for ${wallet.address}: ${allValidatorPositions.filter((v) => v.wallet === wallet.address).length}`,
            )
          }

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Validator fetch timeout")), VALIDATOR_FETCH_TIMEOUT),
          )

          await Promise.race([fetchValidatorPositions(), timeoutPromise])
        } catch (err: any) {
          if (err.message === "Validator fetch timeout") {
            console.log(`[v0] Validator fetch timed out for ${wallet.address} - continuing without complete data`)
          } else {
            console.log(`[v0] Error fetching validator positions for ${wallet.address}:`, err)
          }
        }
      }

      for (const tokenAddress of tokens) {
        try {
          const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
          const [name, symbol, decimals] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals(),
          ])

          let totalBalance = BigInt(0)
          for (const wallet of filteredWallets) {
            const balance = await tokenContract.balanceOf(wallet.address)
            totalBalance += balance
          }

          const existing = tokenBalances.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
          if (!existing) {
            tokenBalances.push({
              address: tokenAddress,
              name,
              symbol,
              value: Number(ethers.formatUnits(totalBalance, decimals)),
              decimals,
            })
          }
        } catch (err) {
          console.error(`Error fetching token ${tokenAddress}:`, err)
        }
      }

      setLpPositions(allLPPositions)

      const sortedHexStakes = allHexStakes.sort((a, b) => a.daysRemaining - b.daysRemaining)
      setHexStakes(sortedHexStakes)

      setValidatorPositions(allValidatorPositions) // Set validator positions

      setData({
        totalPLS: ethers.formatEther(totalPLS),
        totalLockedPLS: ethers.formatEther(totalLockedPLS),
        totalDebt: ethers.formatEther(totalDebt),
        walletCount: filteredWallets.length,
        tokenBalances: tokenBalances.filter((t) => t.value > 0),
        liquidLoansVaults,
      })
    } catch (err) {
      setError("The data seems shy — try again in a moment.")
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-[#f1f1f1] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-medium">My portfolio</h1>
          <div className="flex gap-3">
            <button
              className="px-5 py-2.5 text-sm bg-[#7028E4] hover:bg-[#5c1fc7] text-white rounded-xl transition-all font-semibold"
              onClick={() => setShowManageModal(true)}
            >
              Manage wallets
            </button>
            <button
              className="px-5 py-2.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-xl transition-all font-semibold"
              onClick={() => setShowLoadModal(true)}
            >
              Load portfolio by ID
            </button>
          </div>
        </header>

        {wallets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.address}
                onClick={() => toggleWalletSelection(wallet.address)}
                className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
                  selectedWallets.includes(wallet.address)
                    ? "bg-[#1f1f23] text-white border border-[#3f3f46]"
                    : "bg-[#0b0b0d] text-[#71717a] border border-[#27272a] hover:border-[#3f3f46]"
                }`}
              >
                {wallet.label
                  ? `${wallet.label} (${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)})`
                  : `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
              </button>
            ))}
          </div>
        )}

        <section className="space-y-4">
          {error && (
            <div className="bg-card p-4 border border-card rounded-2xl">
              <p className="text-loss text-sm text-center">{error}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card p-6 border border-card rounded-2xl">
              <p className="text-center text-[#a1a1aa] text-sm">Loading portfolio data...</p>
            </div>
          )}

          {!data && !loading && wallets.length === 0 && (
            <div className="bg-card p-6 border border-card rounded-2xl text-center">
              <p className="text-[#a1a1aa] mb-4">No wallets added yet</p>
              <button
                className="px-6 py-3 text-sm bg-[#7028E4] hover:bg-[#5c1fc7] text-white rounded-xl transition-all font-semibold"
                onClick={() => setShowManageModal(true)}
              >
                Add your first wallet
              </button>
            </div>
          )}

          {data && (
            <>
              <div className="bg-card border border-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#27272a]">
                  <h3 className="text-lg font-semibold">Tokens</h3>
                  <div className="flex gap-2">
                    <input
                      className="w-64 p-2 text-sm bg-[#0b0b0d] border border-[#27272a] rounded-xl text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] transition-all"
                      placeholder="Token address (0x...)"
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                    />
                    <button
                      className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white rounded-xl transition-all whitespace-nowrap font-semibold"
                      onClick={addToken}
                    >
                      Add token
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(200px,2fr)_1fr_1fr_1fr] gap-6 pb-3 mb-3 border-b border-[#27272a]">
                  <div className="text-sm font-semibold text-[#a1a1aa]">Token</div>
                  <div className="text-sm font-semibold text-[#a1a1aa] text-right">Price</div>
                  <div className="text-sm font-semibold text-[#a1a1aa] text-right">Amount</div>
                  <div className="text-sm font-semibold text-[#a1a1aa] text-right">Value</div>
                </div>

                <div className="grid grid-cols-[minmax(200px,2fr)_1fr_1fr_1fr] gap-6 items-center py-2">
                  <div className="flex items-center gap-2">
                    <img src="https://gopulse.com/img/coins/PLS.svg" alt="PLS" className="w-6 h-6 rounded-full" />
                    <span className="text-white">PLS</span>
                  </div>
                  <div className="text-right">
                    {tokenPrices[PLS_ADDRESS.toLowerCase()] ? (
                      <div className="flex flex-col items-end">
                        <span className="text-white font-mono text-sm">
                          ${tokenPrices[PLS_ADDRESS.toLowerCase()].toFixed(8)}
                        </span>
                        {tokenPriceChanges[PLS_ADDRESS.toLowerCase()] !== undefined && (
                          <span
                            className={`text-xs font-mono ${
                              tokenPriceChanges[PLS_ADDRESS.toLowerCase()] >= 0 ? "text-gain" : "text-loss"
                            }`}
                          >
                            {tokenPriceChanges[PLS_ADDRESS.toLowerCase()] >= 0 ? "+" : ""}
                            {tokenPriceChanges[PLS_ADDRESS.toLowerCase()].toFixed(2)}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-white font-mono text-sm">—</span>
                    )}
                  </div>
                  <span className="text-white font-mono text-right">
                    {Number.parseFloat(data.totalPLS).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-white font-mono text-right">
                    {tokenPrices[PLS_ADDRESS.toLowerCase()]
                      ? `$${(Number.parseFloat(data.totalPLS) * tokenPrices[PLS_ADDRESS.toLowerCase()]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                </div>

                {featuredTokenBalances.map((token) => {
                  const price = tokenPrices[token.address.toLowerCase()] || 0
                  const priceChange = tokenPriceChanges[token.address.toLowerCase()]
                  const value = Number(token.balance) * price

                  return (
                    <div
                      key={token.address}
                      className="grid grid-cols-[minmax(200px,2fr)_1fr_1fr_1fr] gap-6 items-center py-2"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={token.logo || "/placeholder.svg"}
                          alt={token.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-white">{token.name}</span>
                      </div>
                      <div className="text-right">
                        {price > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-white font-mono text-sm">${price.toFixed(price < 0.01 ? 8 : 2)}</span>
                            {priceChange !== undefined && priceChange !== 0 && (
                              <span className={`text-xs font-mono ${priceChange >= 0 ? "text-gain" : "text-loss"}`}>
                                {priceChange >= 0 ? "+" : ""}
                                {priceChange.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-white font-mono text-sm">—</span>
                        )}
                      </div>
                      <span className="text-white font-mono text-right">
                        {Number(token.balance).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: getDecimalPlaces(token.symbol),
                        })}
                      </span>
                      <span className="text-white font-mono text-right">
                        {price > 0
                          ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                  )
                })}
              </div>

              {data.tokenBalances && data.tokenBalances.length > 0 && (
                <PortfolioCard
                  title="ERC20 Tokens"
                  total={`${data.tokenBalances.length} token${data.tokenBalances.length > 1 ? "s" : ""}`}
                  totalLabel="Tracking"
                  items={data.tokenBalances.map((token: any) => ({
                    label: `${token.name || token.symbol} (${token.symbol})`,
                    value: token.value.toFixed(4),
                  }))}
                />
              )}

              {lpPositions.length > 0 && (
                <PortfolioCard
                  title="LP Positions"
                  total={`${lpPositions.length} position${lpPositions.length > 1 ? "s" : ""}`}
                  totalLabel="Active Pools"
                  items={lpPositions.map((lp: any) => ({
                    label: lp.name,
                    value: `$${lp.value.toFixed(2)}`,
                  }))}
                />
              )}

              {hexStakes.length > 0 && (
                <PortfolioCard
                  title="HEX Stakes"
                  total={`${hexStakes.reduce((sum, stake) => sum + stake.stakeShares, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T-shares | ${hexStakes.length} stake${hexStakes.length > 1 ? "s" : ""} | Average stake length: ${(hexStakes.reduce((sum, stake) => sum + stake.stakedDays, 0) / hexStakes.length).toFixed(0)} days`}
                  totalLabel=""
                  items={(() => {
                    const pulsechainStakes = hexStakes.filter((s) => s.chain === "PulseChain")
                    const ethereumStakes = hexStakes.filter((s) => s.chain === "Ethereum")
                    const hexPrice = tokenPrices[HEX_PULSECHAIN_ADDRESS.toLowerCase()] || 0

                    const createStakeItem = (stake: any) => {
                      const usdValue = stake.stakedHearts * hexPrice
                      return {
                        label: `Day ${stake.daysPassed}/${stake.stakedDays} (${stake.daysRemaining} days left) — Staked HEX ${stake.stakedHearts.toLocaleString(undefined, { maximumFractionDigits: 0 })} — ${stake.stakeShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares`,
                        value:
                          hexPrice > 0
                            ? `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—",
                        valueColor: stake.isActive ? "text-gain" : "text-neutral",
                      }
                    }

                    const items = []

                    if (pulsechainStakes.length > 0) {
                      items.push({
                        label: "PulseChain Stakes",
                        value: "",
                        valueColor: "text-[#a1a1aa]",
                      })
                      items.push(...pulsechainStakes.map(createStakeItem))
                    }

                    if (ethereumStakes.length > 0) {
                      if (pulsechainStakes.length > 0) {
                        items.push({
                          label: "",
                          value: "",
                          valueColor: "text-transparent",
                        })
                      }
                      items.push({
                        label: "Ethereum Stakes",
                        value: "",
                        valueColor: "text-[#a1a1aa]",
                      })
                      items.push(...ethereumStakes.map(createStakeItem))
                    }

                    return items
                  })()}
                />
              )}

              {data.liquidLoansVaults && data.liquidLoansVaults.length > 0 && (
                <PortfolioCard
                  title="Liquid Loans"
                  totalLeft={{
                    label: "Total PLS in collateral",
                    value: `${Number.parseFloat(data.totalLockedPLS).toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS`,
                  }}
                  totalRight={{
                    label: "Total debt (USDL)",
                    value: `${Number.parseFloat(data.totalDebt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDL`,
                  }}
                  items={data.liquidLoansVaults.flatMap((vault: any) => {
                    const shortAddress = `${vault.wallet.slice(0, 4)}…${vault.wallet.slice(-4)}`
                    return [
                      {
                        label: `${shortAddress} - PLS in collateral`,
                        value: Number.parseFloat(vault.lockedPLS).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        }),
                        valueColor: "text-white",
                      },
                      {
                        label: `${shortAddress} - Debt (USDL)`,
                        value: Number.parseFloat(vault.debt).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                        valueColor: "text-white",
                      },
                    ]
                  })}
                />
              )}

              {manualValidatorIds.length > 0 && (
                <div className="bg-card border border-card rounded-2xl p-5">
                  <h3 className="text-lg font-semibold mb-4">Manual Validator Positions</h3>
                  <div className="space-y-4">
                    {manualValidatorIds.map((validatorId) => (
                      <ValidatorInfo key={validatorId} validatorId={validatorId} />
                    ))}
                  </div>
                </div>
              )}

              {validatorPositions.length > 0 && (
                <PortfolioCard
                  title="PulseChain Validator Positions (Auto-discovered)"
                  total={`${validatorPositions.reduce((sum, v) => sum + Number(v.totalStaked), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS staked | ${validatorPositions.length} validator${validatorPositions.length > 1 ? "s" : ""}`}
                  totalLabel=""
                  items={validatorPositions.flatMap((validator: any) => {
                    const shortAddress = `${validator.wallet.slice(0, 4)}…${validator.wallet.slice(-4)}`
                    return [
                      {
                        label: `${shortAddress} - Validator #${validator.validatorIndex}`,
                        value: "",
                        valueColor: "text-[#a1a1aa]",
                      },
                      {
                        label: "Self-Stake",
                        value: `${Number.parseFloat(validator.selfStake).toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS`,
                        valueColor: "text-white",
                      },
                      {
                        label: "Delegations",
                        value: `${Number.parseFloat(validator.delegations).toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS`,
                        valueColor: "text-white",
                      },
                      {
                        label: "Total Staked",
                        value: `${Number.parseFloat(validator.totalStaked).toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS`,
                        valueColor: "text-gain",
                      },
                      {
                        label: "Lifetime Rewards",
                        value: `${Number.parseFloat(validator.lifetimeRewards).toLocaleString(undefined, { maximumFractionDigits: 2 })} PLS`,
                        valueColor: "text-gain",
                      },
                      {
                        label: "APR / Status",
                        value: `${validator.apr}% — ${validator.status}`,
                        valueColor: validator.status === "active" ? "text-gain" : "text-neutral",
                      },
                      {
                        label: "",
                        value: "",
                        valueColor: "text-transparent",
                      },
                    ]
                  })}
                />
              )}
            </>
          )}
        </section>
      </div>

      {showManageModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setShowManageModal(false)}
        >
          <div
            className="bg-card border border-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Manage Wallets</h2>
              <button
                className="text-[#a1a1aa] hover:text-white text-2xl leading-none"
                onClick={() => setShowManageModal(false)}
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <input
                  className="w-full p-3 text-sm bg-[#0b0b0d] border border-[#27272a] rounded-xl text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] transition-all"
                  placeholder="Wallet Address (0x...)"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                />
                <input
                  className="w-full p-3 text-sm bg-[#0b0b0d] border border-[#27272a] rounded-xl text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] transition-all"
                  placeholder="Label (optional)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
                <button
                  className="w-full p-3 text-sm bg-accent hover:bg-accent-hover text-white rounded-xl transition-all font-semibold"
                  onClick={addWallet}
                >
                  Add Wallet
                </button>
              </div>

              {wallets.length > 0 && (
                <div className="space-y-2">
                  {wallets.map((w, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-[#0b0b0d] border border-[#27272a] rounded-xl text-sm"
                    >
                      <span className="break-all text-white font-mono text-xs">
                        {w.label ? `${w.label} (${w.address.slice(0, 6)}...${w.address.slice(-4)})` : w.address}
                      </span>
                      <button
                        className="px-3 py-1.5 ml-3 bg-[#FF5252] text-white rounded-lg hover:bg-[#E04848] text-xs whitespace-nowrap transition-all"
                        onClick={() => removeWallet(i)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {wallets.length > 0 && (
                <button
                  className="w-full p-3 text-sm bg-accent hover:bg-accent-hover text-white rounded-xl transition-all disabled:opacity-50 font-semibold"
                  onClick={savePortfolioId}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Portfolio ID"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setShowLoadModal(false)}
        >
          <div
            className="bg-card border border-card rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Load Portfolio by ID</h2>
              <button
                className="text-[#a1a1aa] hover:text-white text-2xl leading-none"
                onClick={() => setShowLoadModal(false)}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-[#a1a1aa]">
                Summon your portfolio from any browser — just enter your Portfolio ID.
              </p>
              <input
                className="w-full p-3 text-sm bg-[#0b0b0d] border border-[#27272a] rounded-xl text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] transition-all"
                placeholder="Portfolio ID (e.g., M2P668)"
                value={loadId}
                onChange={(e) => setLoadId(e.target.value)}
              />
              {error && <p className="text-loss text-sm">{error}</p>}
              <button
                className="w-full p-3 text-sm bg-accent hover:bg-accent-hover text-white rounded-xl transition-all disabled:opacity-50 font-semibold"
                onClick={loadPortfolioById}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load Portfolio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setNotification({ message: "", show: false })}
        >
          <div
            className="bg-card border border-card rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <p className="text-white text-sm whitespace-pre-line">{notification.message}</p>
              <button
                className="w-full px-6 py-3 text-sm bg-[#7028E4] hover:bg-[#5c1fc7] text-white rounded-xl transition-all font-semibold"
                onClick={() => setNotification({ message: "", show: false })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
