"use client"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import Image from "next/image"

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

const formatMillions = (v: string, decimals = 1) => {
  const num = Number.parseFloat(v)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`
  }
  return formatWithCommas(v)
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
  "function shares(address) view returns (uint256 amount, uint256 wethTotalExcluded, uint256 wethTotalRealised, uint256 wbtcTotalExcluded, uint256 wbtcTotalRealised, uint256 plsTotalExcluded, uint256 plsxTotalRealised)", // 0xce7c2ac2 for Coda
]

const DISTRIBUTOR_ABI = [
  "function totalMissorDistributed() view returns (uint256)",
  "function totalFinvestaDistributed() view returns (uint256)",
  "function totalWgppDistributed() view returns (uint256)",
  "function totalWethDistributed() view returns (uint256)",
  "function totalWbtcDistributed() view returns (uint256)",
  "function totalPlsxDistributed() view returns (uint256)",
]

const BALANCE_ABI = ["function balanceOf(address) view returns (uint256)"] // 0x70a08231

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

  const [liquidityData, setLiquidityData] = useState<{
    opus: { opusAdded: string; plsAdded: string } | null
    coda: { codaAdded: string; plsAdded: string } | null
  }>({ opus: null, coda: null })

  useEffect(() => {
    // Fetch saved lists from database here if needed
  }, [])

  const fetchLiquidityData = async () => {
    try {
      console.log("[v0] Fetching liquidity data...")
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL!)

      // Fetch Opus liquidity data
      const opusLpAddedData = await provider.call({
        to: OPUS_CONTRACT,
        data: "0x77e34bcf", // totalOpusLpAdded
      })
      console.log("[v0] Raw Opus LP added:", opusLpAddedData)

      const opusPlsLpAddedData = await provider.call({
        to: OPUS_CONTRACT,
        data: "0x2f6ec43a", // totalPlsLpAdded
      })
      console.log("[v0] Raw Opus PLS LP added:", opusPlsLpAddedData)

      // Fetch Coda liquidity data
      const codaLpAddedData = await provider.call({
        to: CODA_CONTRACT,
        data: "0x2af2db78", // totalCodaLpAdded
      })
      console.log("[v0] Raw Coda LP added:", codaLpAddedData)

      const codaPlsLpAddedData = await provider.call({
        to: CODA_CONTRACT,
        data: "0x2f6ec43a", // totalPlsLpAdded
      })
      console.log("[v0] Raw Coda PLS LP added:", codaPlsLpAddedData)

      // Baseline PLS for Opus liquidity (pre-tracking amounts)
      const opusPlsBaseline1 = BigInt("49666029536348406754405890")
      const opusPlsBaseline2 = BigInt("17938960181623487006781877")
      const totalOpusPls = BigInt(opusPlsLpAddedData) + opusPlsBaseline1 + opusPlsBaseline2

      // Baseline PLS for Coda liquidity (pre-tracking amounts)
      const codaPlsBaseline1 = BigInt("39551834742159002925770986")
      const codaPlsBaseline2 = BigInt("16191801870025447450804067")
      const totalCodaPls = BigInt(codaPlsLpAddedData) + codaPlsBaseline1 + codaPlsBaseline2

      const formattedData = {
        opus: {
          opusAdded: ethers.formatUnits(opusLpAddedData, 18),
          plsAdded: ethers.formatUnits(totalOpusPls.toString(), 18), // Use total with baseline
        },
        coda: {
          codaAdded: ethers.formatUnits(codaLpAddedData, 18),
          plsAdded: ethers.formatUnits(totalCodaPls.toString(), 18), // Use total with baseline
        },
      }

      console.log("[v0] Formatted liquidity data:", formattedData)
      setLiquidityData(formattedData)
    } catch (error) {
      console.error("[v0] Failed to fetch liquidity data:", error)
    }
  }

  useEffect(() => {
    fetchLiquidityData()
    fetchTotalDistributed()
    fetchTokenPrices()
  }, [])

  const fetchTotalDistributed = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)

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

      for (const address of opusDistributors) {
        const contract = new ethers.Contract(address, DISTRIBUTOR_ABI, provider)
        try {
          const missor = await contract.totalMissorDistributed()
          totalMissor += BigInt(missor)
        } catch (err) {
          console.error(`[v0] Error fetching Missor from ${address}:`, err)
        }
        try {
          const finvesta = await contract.totalFinvestaDistributed()
          totalFinvesta += BigInt(finvesta)
        } catch (err) {
          console.error(`[v0] Error fetching Finvesta from ${address}:`, err)
        }
        try {
          const wgpp = await contract.totalWgppDistributed()
          totalWgpp += BigInt(wgpp)
        } catch (err) {
          console.error(`[v0] Error fetching WGPP from ${address}:`, err)
        }
      }

      let totalWeth = 0n
      let totalPwbtc = 0n
      let totalPlsx = 0n

      for (const address of codaDistributors) {
        const contract = new ethers.Contract(address, DISTRIBUTOR_ABI, provider)
        try {
          const weth = await contract.totalWethDistributed()
          totalWeth += BigInt(weth)
        } catch (err) {
          console.error(`[v0] Error fetching WETH from ${address}:`, err)
        }
        try {
          const Pwbtc = await contract.totalWbtcDistributed()
          totalPwbtc += BigInt(Pwbtc)
        } catch (err) {
          console.error(`[v0] Error fetching pWBTC from ${address}:`, err)
        }
        try {
          const plsx = await contract.totalPlsxDistributed()
          totalPlsx += BigInt(plsx)
        } catch (err) {
          console.error(`[v0] Error fetching PLSX from ${address}:`, err)
        }
      }

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
    const tokens = [
      { name: "missor", address: "0xf3a8541894e4d789e6257a63440094d698d82bad" },
      { name: "finvesta", address: "0x615cfd552e98eb97e5557b03aa41d0e85e98167b" },
      { name: "wgpp", address: "0xf13ca5c98d9aae6294edb9e7299b0bbe1e71265d" },
      { name: "weth", address: "0x42abdfdb63f3282033c766e72cc4810738571609" },
      { name: "Pwbtc", address: "0xe0e1f83a1c64cf65c1a86d7f3445fc4f58f7dcbf" },
      { name: "plsx", address: "0x1b45b9148791d3a104184cd5dfe5ce57193a3ee9" },
      { name: "opus", address: "0x14495adf3e689221655fdc950cd0133051ec61f9" },
      { name: "coda", address: "0x13b62b75cfa35814d30fbeec0682047aa6287dfb" },
    ]

    const prices = await Promise.all(
      tokens.map(async (token) => {
        try {
          const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${token.address}`)
          const data = await response.json()
          const price = data?.pairs?.[0]?.priceUsd
          if (token.name === "finvesta") {
            console.log("[v0] Finvesta price data:", data)
            console.log("[v0] Finvesta price:", price)
          }
          return { name: token.name, price: Number.parseFloat(price || "0") }
        } catch (err) {
          console.error(`[v0] Error fetching price for ${token.name}:`, err)
          return { name: token.name, price: 0 }
        }
      }),
    )
    setTokenPrices({
      missor: prices.find((p) => p.name === "missor")?.price || 0,
      finvesta: prices.find((p) => p.name === "finvesta")?.price || 0,
      wgpp: prices.find((p) => p.name === "wgpp")?.price || 0,
      weth: prices.find((p) => p.name === "weth")?.price || 0,
      Pwbtc: prices.find((p) => p.name === "Pwbtc")?.price || 0,
      plsx: prices.find((p) => p.name === "plsx")?.price || 0,
      opus: prices.find((p) => p.name === "opus")?.price || 0,
      coda: prices.find((p) => p.name === "coda")?.price || 0,
    })
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
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
      const opusContract = new ethers.Contract(OPUS_CONTRACT, OPUS_ABI, provider)
      const codaContract = new ethers.Contract(CODA_ABI, CODA_ABI, provider)

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
          const plsxV1 = BigInt(codaV1Shares[6]) // plsxTotalRealised at index 6
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
          const plsxV2 = BigInt(codaV2Shares[6]) // plsxTotalRealised at index 6
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#111c3a] to-[#0a1628]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-5xl w-full mx-auto px-4 py-8"
      >
        <h1 className="text-center text-6xl md:text-8xl font-['Marcellus_SC'] font-normal tracking-tight text-slate-200 mb-12">
          Opus and Coda
        </h1>
        <Card className="bg-[#0f172a]/90 backdrop-blur border border-blue-900/40 shadow-[0_0_80px_rgba(56,189,248,0.08)] rounded-3xl">
          <CardContent className="py-12 flex flex-col gap-14">
            <div className="text-center space-y-8">
              <img
                src="/opuscoda.jpg"
                alt="Opus & Coda logo"
                className="mx-auto w-64 h-64 md:w-80 md:h-80 rounded-3xl shadow-[0_0_80px_rgba(249,115,22,0.35)]"
              />
              <p className="text-slate-200 text-lg md:text-2xl max-w-4xl mx-auto leading-relaxed">
                The reliable and transparent printer ecosystem on Pulsechain
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(56,189,248,0.1)] bg-black">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/gYR8UD9RlWg?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1"
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
                    <span className="text-orange-300 font-medium">1%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Finvesta</span>
                    <span className="text-orange-300 font-medium">3%</span>
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
                  Total distributed rewards
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
                          <div className="text-slate-100">{formatMillions(totalDistributed.plsx, 2)}</div>
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
              className="max-w-6xl mx-auto py-16 text-center"
            >
              <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-medium text-center mb-12 text-slate-200">
                  See what has accrued by holding Opus and Coda
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
                        {loading ? "Updating..." : rewards && rewards.length > 0 ? "Update rewards" : "Check rewards"}
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
                      {rewards.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 mb-6"
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

                            {/* Total Coda Holdings */}
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
                          </div>
                        </motion.div>
                      )}

                      {rewards.length > 1 && totalRewards && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="grid md:grid-cols-2 gap-6 mt-8 border-t border-slate-700/50 pt-8"
                        >
                          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50">
                            <h3 className="text-xl font-medium mb-4 text-orange-400 text-center">
                              Total Opus rewards
                              {tokenPrices.missor > 0 && tokenPrices.finvesta > 0 && tokenPrices.wgpp > 0 && (
                                <span className="text-slate-400 text-base ml-2">
                                  ($
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
                                  )
                                </span>
                              )}
                            </h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-300">Missor:</span>
                                <span className="text-slate-100 font-medium">
                                  {formatWithCommas(totalRewards.opus.missor)}
                                  {tokenPrices.missor > 0 && (
                                    <span className="text-slate-400 text-sm ml-2">
                                      ($
                                      {formatDecimals(
                                        (Number.parseFloat(totalRewards.opus.missor) * tokenPrices.missor).toString(),
                                        2,
                                      )}
                                      )
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-300">Finvesta:</span>
                                <span className="text-slate-100 font-medium">
                                  {formatWithCommas(formatDecimals(totalRewards.opus.finvesta, 2))}
                                  {tokenPrices.finvesta > 0 && (
                                    <span className="text-slate-400 text-sm ml-2">
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
                              <div className="flex justify-between items-center">
                                <span className="text-slate-300">WGPP:</span>
                                <span className="text-slate-100 font-medium">
                                  {formatWithCommas(formatDecimals(totalRewards.opus.wgpp, 2))}
                                  {tokenPrices.wgpp > 0 && (
                                    <span className="text-slate-400 text-sm ml-2">
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
                          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50">
                            <h3 className="text-xl font-medium mb-4 text-cyan-400 text-center">
                              Total Coda rewards
                              {tokenPrices.weth > 0 && tokenPrices.Pwbtc > 0 && tokenPrices.plsx > 0 && (
                                <span className="text-slate-400 text-base ml-2">
                                  ($
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
                                  )
                                </span>
                              )}
                            </h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-300">WETH:</span>
                                <span className="text-slate-100 font-medium">
                                  {formatDecimals(totalRewards.coda.weth, 4)}
                                  {tokenPrices.weth > 0 && (
                                    <span className="text-slate-400 text-sm ml-2">
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
                              <div className="flex justify-between items-center">
                                <span className="text-slate-300">pWBTC:</span>
                                <span className="text-slate-100 font-medium">
                                  {formatDecimals(totalRewards.coda.Pwbtc, 4)}
                                  {tokenPrices.Pwbtc > 0 && (
                                    <span className="text-slate-400 text-sm ml-2">
                                      ($
                                      {formatDecimals(
                                        (Number.parseFloat(totalRewards.coda.Pwbtc) * tokenPrices.Pwbtc).toString(),
                                        2,
                                      )}
                                      )
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-300">PLSX:</span>
                                <span className="text-slate-100 font-medium">
                                  {formatMillions(totalRewards.coda.plsx, 2)}
                                  {tokenPrices.plsx > 0 && (
                                    <span className="text-slate-400 text-sm ml-2">
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
                        </motion.div>
                      )}

                      {/* Individual wallet rewards */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {rewards.map((walletRewards, walletIndex) => (
                          <div key={walletIndex} className="space-y-4">
                            <p className="text-slate-400 text-sm font-mono">
                              {walletRewards.address.slice(0, 6)}...{walletRewards.address.slice(-4)}
                            </p>

                            <div className="rounded-2xl bg-[#111c3a] border border-slate-700/50 p-4 sm:p-6">
                              <h3 className="text-lg font-medium mb-3 text-slate-200 text-center">Token Holdings</h3>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-orange-300 text-sm">Opus:</span>
                                  <span className="text-slate-100 font-medium">
                                    {formatWithCommas(Number.parseFloat(walletRewards.holdings.opus).toFixed(0))}
                                    {tokenPrices.opus > 0 && (
                                      <span className="text-slate-400 text-sm ml-2">
                                        ($
                                        {formatWithCommas(
                                          (Number.parseFloat(walletRewards.holdings.opus) * tokenPrices.opus).toFixed(
                                            2,
                                          ),
                                        )}
                                        )
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-cyan-300 text-sm">Coda:</span>
                                  <span className="text-slate-100 font-medium">
                                    {formatWithCommas(Number.parseFloat(walletRewards.holdings.coda).toFixed(0))}
                                    {tokenPrices.coda > 0 && (
                                      <span className="text-slate-400 text-sm ml-2">
                                        ($
                                        {formatWithCommas(
                                          (Number.parseFloat(walletRewards.holdings.coda) * tokenPrices.coda).toFixed(
                                            2,
                                          ),
                                        )}
                                        )
                                      </span>
                                    )}
                                  </span>
                                </div>
                                {tokenPrices.opus > 0 && tokenPrices.coda > 0 && (
                                  <>
                                    <div className="border-t border-slate-700 my-2"></div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-300 text-sm font-medium">Total Value:</span>
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
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                              {/* Opus Rewards Card */}
                              <div className="rounded-2xl bg-[#111c3a] border border-orange-900/30 p-4 sm:p-6 overflow-hidden">
                                <h3 className="text-xl font-medium mb-4 text-orange-300 text-center">Opus Rewards</h3>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-300 flex-shrink-0">Missor:</span>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-slate-100 font-medium whitespace-nowrap">
                                        {formatMillions(walletRewards.opus.missor)}
                                      </div>
                                      {tokenPrices.missor > 0 && (
                                        <div className="text-slate-400 text-sm whitespace-nowrap">
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
                                  <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-300 flex-shrink-0">Finvesta:</span>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-slate-100 font-medium whitespace-nowrap">
                                        {formatDecimals(walletRewards.opus.finvesta, 2)}
                                      </div>
                                      {tokenPrices.finvesta > 0 && (
                                        <div className="text-slate-400 text-sm whitespace-nowrap">
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
                                  <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-300 flex-shrink-0">WGPP:</span>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-slate-100 font-medium whitespace-nowrap">
                                        {formatDecimals(walletRewards.opus.wgpp, 2)}
                                      </div>
                                      {tokenPrices.wgpp > 0 && (
                                        <div className="text-slate-400 text-sm whitespace-nowrap">
                                          $
                                          {formatDecimals(
                                            (Number.parseFloat(walletRewards.opus.wgpp) * tokenPrices.wgpp).toString(),
                                            2,
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Coda Rewards Card */}
                              <div className="rounded-2xl bg-[#111c3a] border border-cyan-900/30 p-4 sm:p-6 overflow-hidden">
                                <h3 className="text-xl font-medium mb-4 text-cyan-300 text-center">Coda Rewards</h3>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-300 flex-shrink-0">WETH:</span>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-slate-100 font-medium whitespace-nowrap">
                                        {formatDecimals(walletRewards.coda.weth, 4)}
                                      </div>
                                      {tokenPrices.weth > 0 && (
                                        <div className="text-slate-400 text-sm whitespace-nowrap">
                                          $
                                          {formatDecimals(
                                            (Number.parseFloat(walletRewards.coda.weth) * tokenPrices.weth).toString(),
                                            2,
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-300 flex-shrink-0">pWBTC:</span>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-slate-100 font-medium whitespace-nowrap">
                                        {formatDecimals(walletRewards.coda.Pwbtc, 4)}
                                      </div>
                                      {tokenPrices.Pwbtc > 0 && (
                                        <div className="text-slate-400 text-sm whitespace-nowrap">
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
                                  <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-300 flex-shrink-0">PLSX:</span>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-slate-100 font-medium whitespace-nowrap">
                                        {formatMillions(walletRewards.coda.plsx, 2)}
                                      </div>
                                      {tokenPrices.plsx > 0 && (
                                        <div className="text-slate-400 text-sm whitespace-nowrap">
                                          $
                                          {formatDecimals(
                                            (Number.parseFloat(walletRewards.coda.plsx) * tokenPrices.plsx).toString(),
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
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.section>
            <div className="text-center space-y-8 mt-8">
              <h2 className="text-2xl md:text-3xl text-slate-200 font-medium">
                Have you decided how many of each to own?
              </h2>
              <div className="flex flex-col md:flex-row justify-center items-center gap-12">
                <Link
                  href="https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/?outputCurrency=0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
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
                  href="https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/?outputCurrency=0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
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
              </div>
            </div>
            <div>
              <p className="text-slate-200 text-sm mb-4 text-center">Contract addresses</p>
              <div className="space-y-3 text-cyan-300 text-base text-center">
                <div>
                  <Link
                    href="https://otter.pulsechain.com/address/0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-cyan-200 transition"
                  >
                    Opus: 0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4
                  </Link>
                </div>
                <div>
                  <Link
                    href="https://otter.pulsechain.com/address/0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-cyan-200 transition"
                  >
                    Coda: 0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-8">
              <Link href="https://x.com/OpusCodaPrinter" target="_blank" rel="noopener noreferrer" className="group">
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
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-5.061 3.345-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
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
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-5.061 3.345-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
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
