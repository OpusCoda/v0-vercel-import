"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { ethers } from "ethers"
import { savePortfolio, loadPortfolio } from "./actions"
import PortfolioCard from "@/components/portfolio-card"
import { fetchPulseAssets, fetchLPPositions } from "@/lib/fetch-live-data"
import { Skeleton } from "@/components/ui/skeleton" // Changed from default import to named import

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
    name: "HEX (Pulsechain)",
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
  {
    address: "0xAbF663531FA10ab8116cbf7d5c6229B018A26Ff9",
    symbol: "eHDRN",
    name: "HDRN (from Ethereum)",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0xAbF663531FA10ab8116cbf7d5c6229B018A26Ff9.png",
  },
  {
    address: "0xefD766cCb38EaF1dfd701853BFCe31359239F305",
    symbol: "eDAI",
    name: "DAI (from Ethereum)",
    logo: "https://gopulse.com/img/coins/DAI.svg",
  },
  {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    symbol: "pDAI",
    name: "pDAI",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x6B175474E89094C44Da98b954EedeAC495271d0F.png",
  },
  {
    address: "0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07",
    symbol: "eUSDC",
    name: "USDC (from Ethereum)",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07.png",
  },
  {
    address: "0xfc4913214444af5c715cc9f7b52655e788a569ed",
    symbol: "ICSA",
    name: "Icosa",
    logo: "https://gopulse.com/img/coins/ICSA.svg",
  },
  {
    address: "0xca35638a3fddd02fec597d8c1681198c06b23f58",
    symbol: "TIME",
    name: "TIME",
    logo: "https://gopulse.com/img/coins/TIME.svg",
  },
  {
    address: "0x9159f1d2a9f51998fc9ab03fbd8f265ab14a1b3b",
    symbol: "LOAN",
    name: "LOAN",
    logo: "https://gopulse.com/img/coins/LOAN.svg",
  },
  {
    address: "0xb513038bbfdf9d40b676f41606f4f61d4b02c4a2",
    symbol: "EARN",
    name: "EARN",
    logo: "https://gopulse.com/img/coins/EARN.svg",
  },
  {
    address: "0x3819f64f282bf135d62168C1e513280dAF905e06",
    symbol: "HDRN",
    name: "Hedron",
    logo: "https://gopulse.com/img/coins/HDRN.svg",
  },
  {
    address: "0xCc78A0acDF847A2C1714D2A925bB4477df5d48a6",
    symbol: "ATROPA",
    name: "Atropa",
    logo: "https://gopulse.com/img/coins/ATROPA.svg",
  },
  {
    address: "0x207e6b4529840a4fd518f73c68bc9c19b2a15944",
    symbol: "MINT",
    name: "Mintra",
    logo: "https://gopulse.com/img/coins/MINT.svg",
  },
  {
    address: "0x8BDB63033b02C15f113De51EA1C3a96Af9e8ecb5",
    symbol: "AXIS",
    name: "AxisAlive",
    logo: "https://gopulse.com/img/coins/AXIS.svg",
  },
  {
    address: "0x5a9790bfe63f3ec57f01b087cd65bd656c9034a8",
    symbol: "COM",
    name: "Communis",
    logo: "https://gopulse.com/img/coins/COM.svg",
  },
  {
    address: "0xAeC4C07537B03E3E62fc066EC62401Aed5Fdd361",
    symbol: "TETRA",
    name: "TETRA",
    logo: "https://gopulse.com/img/coins/TETRA.svg",
  },
]

const OGWEBCHEF_TOKENS = [
  {
    address: "0x2401E09acE92C689570a802138D6213486407B24",
    symbol: "🎭",
    name: "REMEMBER",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x2401E09acE92C689570a802138D6213486407B24.png",
  },
  {
    address: "0xd79E7D1696D71E6Ce2EaA9d867230DB78d6F46C1",
    symbol: "DADAISM",
    name: "DADAISM",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0xd79E7D1696D71E6Ce2EaA9d867230DB78d6F46C1.png",
  },
  {
    address: "0x8220342e1a61abd28d65f6b1d9eb653d8dfd1c85",
    symbol: "FLEXMAS",
    name: "FLEXMAS",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x8220342e1a61abd28d65f6b1d9eb653d8dfd1c85.png",
  },
  {
    address: "0x041a80b38d3a5b4dbb30e56440cA8F0C8DFA6412",
    symbol: "SⒶV",
    name: "SⒶVⒶNT",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x041a80b38d3a5b4dbb30e56440ca8f0c8dfa6412.png",
  },
  {
    address: "0x1C81b4358246d3088Ab4361aB755F3D8D4dd62d2",
    symbol: "FINVESTA",
    name: "Finvesta",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x1C81b4358246d3088Ab4361aB755F3D8D4dd62d2.png",
  },
  {
    address: "0x042b48a98B37042D58Bc8defEEB7cA4eC76E6106",
    symbol: "GAS",
    name: "Gas Money",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x042b48a98B37042D58Bc8defEEB7cA4eC76E6106.png",
  },
  {
    address: "0x116D162d729E27E2E1D6478F1d2A8AEd9C7a2beA",
    symbol: "DOMINANCE",
    name: "DOMINANCE",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x116D162d729E27E2E1D6478F1d2A8AEd9C7a2beA.png",
  },
  {
    address: "0xdc60f0EE40bEd3078614bE202555d2f07d38166e",
    symbol: "BEAST",
    name: "BEAST",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0xdc60f0EE40bEd3078614bE202555d2f07d38166e.png",
  },
  {
    address: "0x063E79CF6A555dac9033EAa3c61A8f02F1020759",
    symbol: "MISSOR",
    name: "Missor",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x063E79CF6A555dac9033EAa3c61A8f02F1020759.png",
  },
  {
    address: "0x770CFA2FB975E7bCAEDDe234D92c3858C517Adca",
    symbol: "WGPDAIP",
    name: "WORLDS GREATEST PDAI PRINTER",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x770CFA2FB975E7bCAEDDe234D92c3858C517Adca.png",
  },
  {
    address: "0x5Db83315591bD3c121700890E03B8fE6Fe40a486",
    symbol: "👵🏽",
    name: "Nana",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x5Db83315591bD3c121700890E03B8fE6Fe40a486.png",
  },
  {
    address: "0xA9D27362ff93f1BCEAa8290FFC36b6D98f4669b9",
    symbol: "🔊",
    name: "RAISE IT UP",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0xA9D27362ff93f1BCEAa8290FFC36b6D98f4669b9.png",
  },
  {
    address: "0x406A63a837AC947ec0C2f0E6673e8Ef481cA7807",
    symbol: "FLEXBOOST",
    name: "FLEXBOOST",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x406A63a837AC947ec0C2f0E6673e8Ef481cA7807.png",
  },
  {
    address: "0x578Cd5Aed5e8F06a5b7959caaFc6213e954F434E",
    symbol: "🧠",
    name: "Mnemonics",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x578Cd5Aed5e8F06a5b7959caaFc6213e954F434E.png",
  },
  {
    address: "0x6d664cb8F9DB9C5BCB7190c954d5b45F67f2d809",
    symbol: "ESE",
    name: "ESE BABY",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x6d664cb8F9DB9C5BCB7190c954d5b45F67f2d809.png",
  },
  {
    address: "0x121Ed41dEE86741193F8856eC0CfB38158A7cBAA",
    symbol: "↑↑↑",
    name: "Sursum",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0x121Ed41dEE86741193F8856eC0CfB38158A7cBAA.png",
  },
  {
    address: "0xE547B798DA37Ecda21Cb1886f33CB34e85852657",
    symbol: "🏧",
    name: "GAS Station",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0xE547B798DA37Ecda21Cb1886f33CB34e85852657.png",
  },
]

const ALWAYS_VISIBLE_TOKENS = [
  {
    address: "0xbdE852ef424Aa15B83b8Eb6442Dc0C165d2E63F4",
    symbol: "OPUS",
    name: "Opus",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0xbdE852ef424Aa15B83b8Eb6442Dc0C165d2E63F4.png",
  },
  {
    address: "0xDC3262de8d7DE75f6A58304475C8cf3950626F7e",
    symbol: "CODA",
    name: "Coda",
    logo: "https://dd.dexscreener.com/ds-data/tokens/pulsechain/0xDC3262de8d7DE75f6A58304475C8cf3950626F7e.png",
  },
]

const getTokenLogo = (address: string): string => {
  // Check if token has a custom logo in ALWAYS_VISIBLE_TOKENS
  const customToken = ALWAYS_VISIBLE_TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase())
  if (customToken) {
    return customToken.logo
  }
  // Default to PulseX token images
  return `https://tokens.app.pulsex.com/images/tokens/${address}.png`
}

const PLS_ADDRESS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27" // Wrapped PLS address for price lookup

const HEX_PULSECHAIN_ADDRESS = "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39"
const HEX_ETHEREUM_ADDRESS = "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39" // HEX on Ethereum mainnet

const HEX_STAKING_ABI = [
  "function stakeCount(address) view returns (uint256)",
  "function stakeLists(address, uint256) view returns (uint40 stakeId, uint72 stakedHearts, uint72 stakeShares, uint16 lockedDay, uint16 stakedDays, uint16 unlockedDay, bool isAutoStake)",
  "function currentDay() view returns (uint256)",
]

const HSI_MANAGER_ABI = [
  "function stakeCount(address) view returns (uint256)",
  "function stakeLists(address, uint256) view returns (uint40 stakeId, uint72 stakedHearts, uint72 stakeShares, uint16 lockedDay, uint16 stakedDays, uint16 unlockedDay, bool isAutoStake)",
]

const HSI_MANAGER_ADDRESS = ethers.getAddress("0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3")
const HSI_MANAGER_ETHEREUM_ADDRESS = ethers.getAddress("0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3")

const VALIDATOR_DEPOSIT_ABI = [
  "event DepositEvent(bytes pubkey, bytes withdrawal_credentials, bytes amount, bytes signature, bytes index)",
  "function get_deposit_count() view returns (bytes)",
]

const PULSECHAIN_DEPOSIT_CONTRACT = "0x3693693693693693693693693693693693693693"

const getDecimalPlaces = (symbol: string): number => {
  const upperSymbol = symbol.toUpperCase()
  if (upperSymbol === "WETH") return 4
  if (["HEX", "EHEX", "PLSX", "PLS", "🎭", "REMEMBER"].includes(upperSymbol)) return 0
  return 2 // default for other tokens
}

const formatLargeNumber = (value: number, decimals: number): string => {
  if (value > 1_000_000_000_000) {
    // More than 1 trillion
    return `${(value / 1_000_000_000_000).toFixed(3)}T`
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

const fetchINCPrice = async (plsUsdPrice: number): Promise<number> => {
  try {
    const INC_WPLS_PAIR = "0xf808bb6265e9ca27002c0a04562bf50d4fe37eaa" // INC/WPLS pair on PulseX
    const PAIR_ABI = [
      "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    ]

    const provider = new ethers.JsonRpcProvider("https://rpc.pulsechain.com/v1")
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

const fetchEHEXPrice = async (plsUsdPrice: number): Promise<number> => {
  try {
    // eHEX/WPLS pair on PulseX - you may need to find the correct pair address
    // For now, we'll try to fetch from a common pair or return 0 if not available
    const EHEX_WPLS_PAIR = "0x87188e66e973c6264d34781d0b03b413a63180d4" // Actual eHEX/WPLS pair on PulseX

    // If we don't have a valid pair address, skip DEX fetch
    if (EHEX_WPLS_PAIR === "0x0000000000000000000000000000000000000000") {
      console.log("[v0] eHEX DEX pair not configured, skipping DEX price fetch")
      return 0
    }

    const PAIR_ABI = [
      "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    ]

    const provider = new ethers.JsonRpcProvider("https://rpc.pulsechain.com/v1")
    const pairContract = new ethers.Contract(EHEX_WPLS_PAIR, PAIR_ABI, provider)

    const reserves = await pairContract.getReserves()
    const reserveEHEX = Number(ethers.formatUnits(reserves.reserve0, 8)) // eHEX has 8 decimals
    const reserveWPLS = Number(ethers.formatUnits(reserves.reserve1, 18)) // WPLS is reserve1

    const ehexPriceInPLS = reserveWPLS / reserveEHEX
    const ehexUsdPrice = ehexPriceInPLS * plsUsdPrice

    console.log(`[v0] eHEX price from DEX: $${ehexUsdPrice.toFixed(8)}`)
    return ehexUsdPrice
  } catch (error) {
    console.error("[v0] Error fetching eHEX price from DEX:", error)
    return 0
  }
}

// Modified fetchDexscreenerPrice to filter by liquidity and add manual pair for BEAST
const fetchDexscreenerPrice = async (
  tokenAddress: string,
  pairAddress?: string,
): Promise<{ price: number; change: number }> => {
  try {
    console.log(`[v0] Fetching Dexscreener price for ${tokenAddress}${pairAddress ? ` using pair ${pairAddress}` : ""}`)

    // If specific pair address is provided, fetch from that pair directly
    if (pairAddress) {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${pairAddress}`)
      const data = await response.json()

      if (data.pair) {
        const price = Number.parseFloat(data.pair.priceUsd) || 0
        const change = Number.parseFloat(data.pair.priceChange?.h24) || 0
        console.log(
          `[v0] Dexscreener price for ${tokenAddress} from pair ${pairAddress}: $${price}, 24h change: ${change}%`,
        )
        return { price, change }
      }
    }

    // Otherwise, use the token address to find the best pair
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
    const data = await response.json()

    if (data.pairs && data.pairs.length > 0) {
      // Find the pair with highest liquidity on PulseChain
      const pulsechainPairs = data.pairs.filter((pair: any) => pair.chainId === "pulsechain")

      if (pulsechainPairs.length > 0) {
        const highLiquidityPairs = pulsechainPairs.filter((pair: any) => (pair.liquidity?.usd || 0) >= 1000)

        // If we have high liquidity pairs, use them; otherwise fall back to all pairs
        const validPairs = highLiquidityPairs.length > 0 ? highLiquidityPairs : pulsechainPairs

        // Sort by liquidity and take the highest
        const bestPair = validPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
        const price = Number.parseFloat(bestPair.priceUsd) || 0
        const change = Number.parseFloat(bestPair.priceChange?.h24) || 0
        const liquidity = bestPair.liquidity?.usd || 0
        console.log(
          `[v0] Dexscreener price for ${tokenAddress}: $${price}, 24h change: ${change}%, liquidity: $${liquidity.toFixed(2)}`,
        )
        return { price, change }
      }
    }

    console.log(`[v0] No Dexscreener price found for ${tokenAddress}`)
    return { price: 0, change: 0 }
  } catch (error) {
    console.error(`[v0] Error fetching Dexscreener price for ${tokenAddress}:`, error)
    return { price: 0, change: 0 }
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

      if (!plsResponse.ok) {
        throw new Error(`CoinGecko API returned ${plsResponse.status}`)
      }

      const plsData = await plsResponse.json()
      if (plsData[PLS_ADDRESS.toLowerCase()]?.usd) {
        plsUsdPrice = plsData[PLS_ADDRESS.toLowerCase()].usd
        prices[PLS_ADDRESS.toLowerCase()] = plsUsdPrice
        changes[PLS_ADDRESS.toLowerCase()] = plsData[PLS_ADDRESS.toLowerCase()].usd_24h_change || 0
        console.log(
          `[v0] PLS price from CoinGecko: $${plsUsdPrice}, 24h change: ${changes[PLS_ADDRESS.toLowerCase()]}%`,
        )
      } else {
        console.log(`[v0] CoinGecko returned no data for PLS, trying Dexscreener`)
        const dexPrice = await fetchDexscreenerPrice(PLS_ADDRESS)
        if (dexPrice.price > 0) {
          plsUsdPrice = dexPrice.price
          prices[PLS_ADDRESS.toLowerCase()] = dexPrice.price
          changes[PLS_ADDRESS.toLowerCase()] = dexPrice.change
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (err) {
      console.log(`[v0] CoinGecko unavailable for PLS, using Dexscreener fallback`)
      const dexPrice = await fetchDexscreenerPrice(PLS_ADDRESS)
      if (dexPrice.price > 0) {
        plsUsdPrice = dexPrice.price
        prices[PLS_ADDRESS.toLowerCase()] = dexPrice.price
        changes[PLS_ADDRESS.toLowerCase()] = dexPrice.change
      }
    }

    let ethereumHexPrice = 0
    let ethereumHexChange = 0
    try {
      console.log(`[v0] Fetching Ethereum HEX price`)
      const ethHexResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${HEX_ETHEREUM_ADDRESS}&vs_currencies=usd&include_24hr_change=true`,
      )

      if (!ethHexResponse.ok) {
        throw new Error(`CoinGecko API returned ${ethHexResponse.status}`)
      }

      const ethHexData = await ethHexResponse.json()
      if (ethHexData[HEX_ETHEREUM_ADDRESS.toLowerCase()]?.usd) {
        ethereumHexPrice = ethHexData[HEX_ETHEREUM_ADDRESS.toLowerCase()].usd
        ethereumHexChange = ethHexData[HEX_ETHEREUM_ADDRESS.toLowerCase()].usd_24h_change || 0

        prices[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] = ethereumHexPrice
        changes[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] = ethereumHexChange

        prices["0x57fde0a71132198bbec939b98976993d8d89d225"] = ethereumHexPrice
        changes["0x57fde0a71132198bbec939b98976993d8d89d225"] = ethereumHexChange

        console.log(
          `[v0] Ethereum HEX price from CoinGecko: $${ethereumHexPrice}, 24h change: ${ethereumHexChange}% (also used for eHEX)`,
        )
      } else {
        console.log(`[v0] CoinGecko returned no data for Ethereum HEX, trying Dexscreener`)
        const dexPrice = await fetchDexscreenerPrice(HEX_ETHEREUM_ADDRESS)
        if (dexPrice.price > 0) {
          ethereumHexPrice = dexPrice.price
          ethereumHexChange = dexPrice.change
          prices[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] = ethereumHexPrice
          changes[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] = ethereumHexChange
          prices["0x57fde0a71132198bbec939b98976993d8d89d225"] = ethereumHexPrice
          changes["0x57fde0a71132198bbec939b98976993d8d89d225"] = ethereumHexChange
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (err) {
      console.log(`[v0] CoinGecko unavailable for Ethereum HEX, using Dexscreener fallback`)
      const dexPrice = await fetchDexscreenerPrice(HEX_ETHEREUM_ADDRESS)
      if (dexPrice.price > 0) {
        ethereumHexPrice = dexPrice.price
        ethereumHexChange = dexPrice.change
        prices[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] = ethereumHexPrice
        changes[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] = ethereumHexChange
        prices["0x57fde0a71132198bbec939b98976993d8d89d225"] = ethereumHexPrice
        changes["0x57fde0a71132198bbec939b98976993d8d89d225"] = ethereumHexChange
      }
    }

    let pulsechainHexPrice = 0
    let pulsechainHexChange = 0

    const ogwebchefAddresses = OGWEBCHEF_TOKENS.map((t) => t.address.toLowerCase())
    const alwaysVisibleAddresses = ALWAYS_VISIBLE_TOKENS.map((t) => t.address.toLowerCase())
    const bridgedAddresses = [
      "0xAbF663531FA10ab8116cbf7d5c6229B018A26Ff9", // eHDRN
      "0x02DcdD04e3F455D838cd1249292C58f3B79e3C3C", // eWETH
      "0xefD766cCb38EaF1dfd701853BFCe31359239F305", // eDAI
      "0x6B175474E89094C44Da98b954EedeAC495271d0F", // pDAI (This is actually DAI from Mainnet, but let's assume it's intended to be bridged)
      "0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07", // eUSDC
    ]

    for (const address of tokenAddresses) {
      if (address.toLowerCase() === PLS_ADDRESS.toLowerCase()) continue

      if (address.toLowerCase() === "0x57fde0a71132198bbec939b98976993d8d89d225") {
        console.log(`[v0] Skipping eHEX price fetch (already set from Ethereum HEX)`)
        continue
      }

      if (address.toLowerCase() === "0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d") {
        if (plsUsdPrice > 0) {
          const incPrice = await fetchINCPrice(plsUsdPrice)
          if (incPrice > 0) {
            prices[address.toLowerCase()] = incPrice
            changes[address.toLowerCase()] = 0
          }
        }
        continue
      }

      if (address.toLowerCase() === "0x041a80b38d3a5b4dbb30e56440ca8f0c8dfa6412") {
        const dexPrice = await fetchDexscreenerPrice(address, "0x4d73f59d0b426ca2f3b1f3e1769e53c96fcd3f2e")
        if (dexPrice.price > 0) {
          prices[address.toLowerCase()] = dexPrice.price
          changes[address.toLowerCase()] = dexPrice.change
        }
        await new Promise((resolve) => setTimeout(resolve, 300))
        continue
      }

      if (address.toLowerCase() === "0xdc60f0ee40bed3078614be202555d2f07d38166e") {
        const dexPrice = await fetchDexscreenerPrice(address, "0xc273F0a563e4E2086e2435574E46D974CAF40D4e")
        if (dexPrice.price > 0) {
          prices[address.toLowerCase()] = dexPrice.price
          changes[address.toLowerCase()] = dexPrice.change
        }
        await new Promise((resolve) => setTimeout(resolve, 300))
        continue
      }

      if (
        ogwebchefAddresses.includes(address.toLowerCase()) ||
        alwaysVisibleAddresses.includes(address.toLowerCase()) ||
        bridgedAddresses.includes(address.toLowerCase())
      ) {
        const dexPrice = await fetchDexscreenerPrice(address)
        if (dexPrice.price > 0) {
          prices[address.toLowerCase()] = dexPrice.price
          changes[address.toLowerCase()] = dexPrice.change
        }
        await new Promise((resolve) => setTimeout(resolve, 300)) // Longer delay for Dexscreener
        continue
      }

      try {
        console.log(`[v0] Fetching price for ${address}`)
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/token_price/pulsechain?contract_addresses=${address}&vs_currencies=usd&include_24hr_change=true`,
        )

        if (!response.ok) {
          throw new Error(`CoinGecko API returned ${response.status}`)
        }

        const data = await response.json()

        if (data[address.toLowerCase()]?.usd) {
          prices[address.toLowerCase()] = data[address.toLowerCase()].usd
          changes[address.toLowerCase()] = data[address.toLowerCase()].usd_24h_change || 0
          console.log(
            `[v0] Price for ${address}: $${data[address.toLowerCase()].usd}, 24h change: ${changes[address.toLowerCase()]}%`,
          )

          if (address.toLowerCase() === HEX_PULSECHAIN_ADDRESS.toLowerCase()) {
            pulsechainHexPrice = data[address.toLowerCase()].usd
            pulsechainHexChange = data[address.toLowerCase()].usd_24h_change || 0
          }
        } else {
          console.log(`[v0] CoinGecko returned no data for ${address}, trying Dexscreener`)
          const dexPrice = await fetchDexscreenerPrice(address)
          if (dexPrice.price > 0) {
            prices[address.toLowerCase()] = dexPrice.price
            changes[address.toLowerCase()] = dexPrice.change
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (err) {
        console.log(`[v0] CoinGecko unavailable for ${address}, using Dexscreener fallback`)
        const dexPrice = await fetchDexscreenerPrice(address)
        if (dexPrice.price > 0) {
          prices[address.toLowerCase()] = dexPrice.price
          changes[address.toLowerCase()] = dexPrice.change
        }
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
  // ADDED STATE FOR LOADING STAGE TRACKING
  const [loadingStage, setLoadingStage] = useState<string>("")
  const [dataLoading, setDataLoading] = useState(false) // Add separate state for data loading
  const [error, setError] = useState("")
  const [loadId, setLoadId] = useState("")
  const [saving, setSaving] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [selectedWallets, setSelectedWallets] = useState<string[]>([])
  const [featuredTokenBalances, setFeaturedTokenBalances] = useState<any[]>([])
  const [ogwebchefTokenBalances, setOgwebchefTokenBalances] = useState<any[]>([])
  const [alwaysVisibleTokenBalances, setAlwaysVisibleTokenBalances] = useState<any[]>([])
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({})
  const [tokenPriceChanges, setTokenPriceChanges] = useState<Record<string, number>>({})
  const [hexStakes, setHexStakes] = useState<any[]>([])
  const [hsiStakes, setHsiStakes] = useState<any[]>([]) // Declare hsiStakes here
  const [hsiCount, setHsiCount] = useState<number>(0)
  const [notification, setNotification] = useState<{ message: string; show: boolean }>({ message: "", show: false })

  const priceCache = useRef<{
    prices: Record<string, number>
    changes: Record<string, number>
    timestamp: number
  } | null>(null)
  const PRICE_CACHE_TTL = 60000 // 60 seconds
  const ETHEREUM_TIMEOUT = 60000 // 60 second timeout for Ethereum RPC calls

  const provider = useMemo(() => {
    const rpcUrls = ["https://rpc.pulsechain.com/v1", "https://pulsechain-rpc.publicnode.com"]
    return new ethers.JsonRpcProvider(rpcUrls[0])
  }, [])
  const ethereumProvider = useMemo(() => new ethers.JsonRpcProvider("https://ethereum.rpc.thirdweb.com"), [])

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

  const toggleWalletSelection = (address: string) => {
    console.log("[v0] toggleWalletSelection called for:", address)
    console.log("[v0] Current selectedWallets:", selectedWallets)

    setSelectedWallets((prev) => {
      const newSelection = prev.includes(address)
        ? prev.length === 1
          ? prev
          : prev.filter((a) => a !== address)
        : [...prev, address]

      console.log("[v0] New selectedWallets:", newSelection)
      return newSelection
    })
  }

  const filteredWallets = useMemo(() => {
    const filtered = selectedWallets.length === 0 ? wallets : wallets.filter((w) => selectedWallets.includes(w.address))
    console.log(
      "[v0] filteredWallets updated:",
      filtered.map((w) => w.address),
    )
    return filtered
  }, [wallets, selectedWallets])

  useEffect(() => {
    console.log("[v0] selectedWallets changed, triggering fetchData")
    console.log("[v0] filteredWallets.length:", filteredWallets.length)
    console.log(
      "[v0] filteredWallets addresses:",
      filteredWallets.map((w) => w.address),
    )

    if (filteredWallets.length > 0) {
      fetchData()
    } else {
      setData(null) // Clear data if no wallets are selected
    }
  }, [selectedWallets]) // Removed tokens.length dependency as it's handled by fetchData itself

  // Load cached NFTs on mount

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
    localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets, tokens: updated }))
    setNewToken("")
    setError("")
    if (filteredWallets.length > 0) {
      fetchData()
    }
  }

  const removeToken = (index: number) => {
    const updated = tokens.filter((_, i) => i !== index)
    setTokens(updated)
    localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets, tokens: updated }))
  }

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

  const totalPortfolioValue = useMemo(() => {
    if (!data) return 0

    let total = 0

    // PLS value
    const plsPrice = tokenPrices[PLS_ADDRESS.toLowerCase()] || 0
    total += Number.parseFloat(data.totalPLS) * plsPrice

    // Featured tokens value (only those with $1+ value)
    featuredTokenBalances
      .filter((token) => {
        const price = tokenPrices[token.address.toLowerCase()] || 0
        const value = Number(token.balance) * price
        return value >= 1
      })
      .forEach((token) => {
        const price = tokenPrices[token.address.toLowerCase()] || 0
        total += Number(token.balance) * price
      })

    // Opus and Coda printers
    alwaysVisibleTokenBalances.forEach((token) => {
      const price = tokenPrices[token.address.toLowerCase()] || 0
      total += Number(token.balance) * price
    })

    // OGWebChef tokens (only those with $1+ value)
    ogwebchefTokenBalances
      .filter((token) => {
        const price = tokenPrices[token.address.toLowerCase()] || 0
        const value = Number(token.balance) * price
        return value >= 1
      })
      .forEach((token) => {
        const price = tokenPrices[token.address.toLowerCase()] || 0
        total += Number(token.balance) * price
      })

    // HEX stakes value
    const hexPulsechainPrice = tokenPrices[HEX_PULSECHAIN_ADDRESS.toLowerCase()] || 0
    const hexEthereumPrice = tokenPrices[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] || 0
    hexStakes.forEach((stake) => {
      const hexPrice = stake.chain === "Ethereum" ? hexEthereumPrice : hexPulsechainPrice
      total += stake.stakedHearts * hexPrice
    })

    // HSI stakes value
    hsiStakes.forEach((stake) => {
      const hexPrice = stake.chain === "Ethereum" ? hexEthereumPrice : hexPulsechainPrice
      total += stake.stakedHearts * hexPrice
    })

    // PLS value in Liquid Loans
    total += Number.parseFloat(data.totalLockedPLS) * plsPrice

    return total
  }, [
    data,
    tokenPrices,
    featuredTokenBalances,
    alwaysVisibleTokenBalances,
    ogwebchefTokenBalances,
    hexStakes,
    hsiStakes,
  ])

  const fetchData = async () => {
    console.log("[v0] fetchData called")
    console.log(
      "[v0] filteredWallets in fetchData:",
      filteredWallets.map((w) => w.address),
    )

    if (filteredWallets.length === 0) {
      setError("Add at least one wallet")
      setData(null) // Clear existing data when no wallets are selected
      return
    }

    setDataLoading(true)
    // UPDATED: Set initial loading message
    setLoadingStage("Hold on a tick — we're just coaxing your numbers out of the blockchain.")
    console.log("[v0] Starting data fetch for", filteredWallets.length, "wallets")

    try {
      const now = Date.now()
      let prices: Record<string, number> = {}
      let changes: Record<string, number> = {}

      // UPDATED: Update loading stage for price fetching
      setLoadingStage("Hold on a tick — we're just coaxing your numbers out of the blockchain...")

      if (priceCache.current && now - priceCache.current.timestamp < PRICE_CACHE_TTL) {
        console.log("[v0] Using cached prices")
        prices = priceCache.current.prices
        changes = priceCache.current.changes
      } else {
        console.log("[v0] Fetching fresh prices")
        const addressesToFetch = [
          PLS_ADDRESS,
          ...FEATURED_TOKENS.map((t) => t.address),
          ...OGWEBCHEF_TOKENS.map((t) => t.address),
          ...ALWAYS_VISIBLE_TOKENS.map((t) => t.address),
          "0xAbF663531FA10ab8116cbf7d5c6229B018A26Ff9",
          "0x02DcdD04e3F455D838cd1249292C58f3B79e3C3C",
          "0xefD766cCb38EaF1dfd701853BFCe31359239F305",
          "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          "0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07",
          HEX_ETHEREUM_ADDRESS,
        ]
        const result = await fetchTokenPrices(addressesToFetch)
        prices = result.prices
        changes = result.changes
        priceCache.current = { prices, changes, timestamp: now }
      }

      setTokenPrices(prices)
      setTokenPriceChanges(changes)

      // UPDATED: Update loading stage for token balances
      setLoadingStage("Loading token balances...")

      // === Fetch Featured, OGWebChef, AlwaysVisible Tokens (parallelized across wallets) ===
      const featuredBalances: any[] = []
      for (const featuredToken of FEATURED_TOKENS) {
        if (featuredToken.address === "0x0000000000000000000000000000000000000000") {
          console.log(`[v0] Skipping ${featuredToken.symbol} - invalid address`)
          continue
        }

        try {
          if (!ethers.isAddress(featuredToken.address)) {
            console.log(`[v0] Invalid address format for ${featuredToken.symbol}, skipping`)
            continue
          }

          const tokenContract = new ethers.Contract(featuredToken.address, ERC20_ABI, provider)
          let decimals = 18
          try {
            decimals = await tokenContract.decimals()
          } catch (decimalError) {
            console.log(`[v0] Could not fetch decimals for ${featuredToken.symbol}, using default 18`)
          }

          const balancePromises = filteredWallets.map(async (wallet) => {
            try {
              return await tokenContract.balanceOf(wallet.address)
            } catch (balanceError) {
              console.log(`[v0] Could not fetch balance for ${featuredToken.symbol} from ${wallet.address}`)
              return BigInt(0)
            }
          })
          const balances = await Promise.all(balancePromises)
          const totalBalance = balances.reduce((sum, bal) => sum + bal, BigInt(0))

          if (totalBalance > 0) {
            featuredBalances.push({
              ...featuredToken,
              balance: ethers.formatUnits(totalBalance, decimals),
              decimals,
            })
          }
        } catch (err) {
          console.log(`[v0] Error processing featured token ${featuredToken.symbol}, skipping`)
        }
      }
      setFeaturedTokenBalances(featuredBalances)

      const ogwebchefTokenBalancesArray: any[] = []
      for (const ogToken of OGWEBCHEF_TOKENS) {
        if (ogToken.address === "0x0000000000000000000000000000000000000000") {
          console.log(`[v0] Skipping ${ogToken.symbol} - invalid address`)
          continue
        }

        try {
          if (!ethers.isAddress(ogToken.address)) {
            console.log(`[v0] Invalid address format for ${ogToken.symbol}, skipping`)
            continue
          }

          const tokenContract = new ethers.Contract(ogToken.address, ERC20_ABI, provider)
          let decimals = 18
          try {
            decimals = await tokenContract.decimals()
          } catch (decimalError) {
            console.log(`[v0] Could not fetch decimals for ${ogToken.symbol}, using default 18`)
          }

          const balancePromises = filteredWallets.map(async (wallet) => {
            try {
              return await tokenContract.balanceOf(wallet.address)
            } catch (balanceError) {
              console.log(`[v0] Could not fetch balance for ${ogToken.symbol} from ${wallet.address}`)
              return BigInt(0)
            }
          })
          const balances = await Promise.all(balancePromises)
          const totalBalance = balances.reduce((sum, bal) => sum + bal, BigInt(0))

          if (ogToken.address.toLowerCase() === "0x041a80b38d3a5b4dbb30e56440ca8f0c8dfa6412") {
            console.log(`[v0] SⒶVⒶNT raw balance: ${totalBalance.toString()}`)
            console.log(`[v0] SⒶVⒶNT formatted balance: ${ethers.formatUnits(totalBalance, decimals)}`)
            console.log(`[v0] SⒶVⒶNT decimals: ${decimals}`)
            console.log(`[v0] SⒶVⒶNT price: ${prices[ogToken.address.toLowerCase()] || 0}`)
          }

          if (totalBalance > 0) {
            ogwebchefTokenBalancesArray.push({
              ...ogToken,
              balance: ethers.formatUnits(totalBalance, decimals),
              decimals,
            })

            if (ogToken.address.toLowerCase() === "0x041a80b38d3a5b4dbb30e56440ca8f0c8dfa6412") {
              console.log(`[v0] SⒶVⒶNT added to ogwebchefTokenBalancesArray`)
            }
          } else {
            if (ogToken.address.toLowerCase() === "0x041a80b38d3a5b4dbb30e56440ca8f0c8dfa6412") {
              console.log(`[v0] SⒶVⒶNT balance is 0, not adding to list`)
            }
          }
        } catch (err) {
          console.log(`[v0] Error processing OGWebChef token ${ogToken.symbol}, skipping`)
        }
      }

      console.log(`[v0] Total OGWEBCHEF tokens with balance > 0: ${ogwebchefTokenBalancesArray.length}`)
      const savantToken = ogwebchefTokenBalancesArray.find(
        (t) => t.address.toLowerCase() === "0x041a80b38d3a5b4dbb30e56440ca8f0c8dfa6412",
      )
      if (savantToken) {
        console.log(`[v0] SⒶVⒶNT found in ogwebchefTokenBalancesArray:`, savantToken)
        console.log(`[v0] SⒶVⒶNT price in prices object:`, prices[savantToken.address.toLowerCase()])
      } else {
        console.log(`[v0] SⒶVⒶNT NOT found in ogwebchefTokenBalancesArray`)
      }
      setOgwebchefTokenBalances(ogwebchefTokenBalancesArray)

      const alwaysVisibleBalances: any[] = []
      for (const alwaysVisibleToken of ALWAYS_VISIBLE_TOKENS) {
        if (alwaysVisibleToken.address === "0x0000000000000000000000000000000000000000") {
          console.log(`[v0] Skipping ${alwaysVisibleToken.symbol} - invalid address`)
          alwaysVisibleBalances.push({
            ...alwaysVisibleToken,
            balance: "0",
            decimals: 18,
          })
          continue
        }

        if (!ethers.isAddress(alwaysVisibleToken.address)) {
          console.log(`[v0] Invalid address format for ${alwaysVisibleToken.symbol}, using 0 balance`)
          alwaysVisibleBalances.push({
            ...alwaysVisibleToken,
            balance: "0",
            decimals: 18,
          })
          continue
        }

        const tokenContract = new ethers.Contract(alwaysVisibleToken.address, ERC20_ABI, provider)
        let decimals = 18
        try {
          decimals = await tokenContract.decimals()
        } catch (decimalError) {
          console.log(`[v0] Could not fetch decimals for ${alwaysVisibleToken.symbol}, using default 18`)
        }

        const balancePromises = filteredWallets.map(async (wallet) => {
          try {
            return await tokenContract.balanceOf(wallet.address)
          } catch (balanceError) {
            console.log(`[v0] Could not fetch balance for ${alwaysVisibleToken.symbol} from ${wallet.address}`)
            return BigInt(0)
          }
        })
        const balances = await Promise.all(balancePromises)
        const totalBalance = balances.reduce((sum, bal) => sum + bal, BigInt(0))

        alwaysVisibleBalances.push({
          ...alwaysVisibleToken,
          balance: ethers.formatUnits(totalBalance, decimals),
          decimals,
        })
      }
      setAlwaysVisibleTokenBalances(alwaysVisibleBalances)

      // UPDATED: Update loading stage for wallet data
      setLoadingStage("Fetching wallet data...")

      console.log("[v0] Fetching wallet data in parallel...")
      const walletDataPromises = filteredWallets.map(async (wallet) => {
        const walletData: any = {
          address: wallet.address,
          plsBalance: BigInt(0),
          tokens: [],
          lpPositions: [],
          liquidLoansVault: null,
          hexStakes: [],
          hsiStakes: [],
        }

        try {
          // Fetch PLS balance
          walletData.plsBalance = await provider.getBalance(wallet.address)

          // Fetch PulseAssets
          try {
            walletData.tokens = await fetchPulseAssets(wallet.address)
          } catch (err) {
            console.error(`Error fetching tokens for ${wallet.address}:`, err)
          }

          // UPDATED: Update loading stage for LP positions
          setLoadingStage("Loading LP positions...")

          // Fetch LP Positions
          try {
            console.log(`[LP] Fetching LP positions for ${wallet.address}`)
            walletData.lpPositions = await fetchLPPositions(wallet.address, prices)
            console.log(`[LP] Raw LPs from fetchLPPositions (${wallet.address}):`, walletData.lpPositions)
          } catch (err) {
            console.error("Error fetching LP positions for wallet:", err)
          }

          // Liquid Loans Vaults
          try {
            const lockedPLS = await vaultManager.getVaultColl(wallet.address)
            const debtUSDL = await vaultManager.getVaultDebt(wallet.address)
            if (lockedPLS > 0 || debtUSDL > 0) {
              walletData.liquidLoansVault = {
                wallet: wallet.address,
                lockedPLS: ethers.formatEther(lockedPLS),
                debt: ethers.formatEther(debtUSDL),
                lockedPLSBigInt: lockedPLS,
                debtBigInt: debtUSDL,
              }
            }
          } catch (vaultError: any) {
            console.log(`Liquid Loans error for ${wallet.address}:`, vaultError.message)
          }

          // UPDATED: Update loading stage for HEX stakes
          setLoadingStage("Loading HEX stakes...")

          // HEX Staking (Pulsechain)
          try {
            const hexContract = new ethers.Contract(HEX_PULSECHAIN_ADDRESS, HEX_STAKING_ABI, provider)
            const currentDay = await hexContract.currentDay()
            const stakeCount = await hexContract.stakeCount(wallet.address)
            for (let i = 0; i < Number(stakeCount); i++) {
              try {
                const stake = await hexContract.stakeLists(wallet.address, i)
                const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
                const stakeShares = ethers.formatUnits(stake.stakeShares, 12)
                const daysPassed = Number(currentDay) - Number(stake.lockedDay)
                const daysRemaining = Number(stake.stakedDays) - daysPassed
                const isActive = stake.unlockedDay === 0
                walletData.hexStakes.push({
                  wallet: wallet.address,
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
              } catch (err) {
                console.error(`Error fetching Pulsechain HEX stake ${i}:`, err)
              }
            }
          } catch (err) {
            console.log(`No Pulsechain HEX stakes for ${wallet.address}`)
          }

          // Ethereum HEX (timeout protected)
          try {
            const fetchEthereumHEX = async () => {
              const hexEthContract = new ethers.Contract(HEX_ETHEREUM_ADDRESS, HEX_STAKING_ABI, ethereumProvider)
              const currentDay = await hexEthContract.currentDay()
              const stakeCount = await hexEthContract.stakeCount(wallet.address)
              for (let i = 0; i < Number(stakeCount); i++) {
                try {
                  const stake = await hexEthContract.stakeLists(wallet.address, i)
                  const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
                  const stakeShares = ethers.formatUnits(stake.stakeShares, 12)
                  const daysPassed = Number(currentDay) - Number(stake.lockedDay)
                  const daysRemaining = Number(stake.stakedDays) - daysPassed
                  const isActive = stake.unlockedDay === 0
                  walletData.hexStakes.push({
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
                  console.error(`Error fetching Ethereum HEX stake ${i}:`, err)
                }
              }
            }
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Ethereum HEX fetch timed out")), ETHEREUM_TIMEOUT),
            )
            await Promise.race([fetchEthereumHEX(), timeoutPromise])
          } catch (err: any) {
            if (err.message !== "Ethereum HEX fetch timed out") {
              console.error(`Error fetching Ethereum HEX stakes:`, err)
            }
          }

          // UPDATED: Update loading stage for HSI stakes
          setLoadingStage("Loading HSI stakes...")

          // Fetch HSI Stakes (Pulsechain)
          try {
            console.log(`[v0] HSI contract call for ${wallet.address} at ${HSI_MANAGER_ADDRESS}`)
            const hsiContract = new ethers.Contract(HSI_MANAGER_ADDRESS, HSI_MANAGER_ABI, provider)
            const hexContract = new ethers.Contract(HEX_PULSECHAIN_ADDRESS, HEX_STAKING_ABI, provider)

            const hsiStakeCount = await hsiContract.stakeCount(wallet.address)
            console.log(`[v0] HSI stakeCount call result for ${wallet.address}: ${hsiStakeCount.toString()}`)

            if (Number(hsiStakeCount) === 0) {
              console.log(`[v0] No HSI stakes detected for ${wallet.address}`)
            }

            const currentDay = await hexContract.currentDay()

            for (let i = 0; i < Number(hsiStakeCount); i++) {
              try {
                const stake = await hsiContract.stakeLists(wallet.address, i)
                console.log(`[v0] HSI stake ${i} loaded:`, stake)

                const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
                const stakeShares = ethers.formatUnits(stake.stakeShares, 12)

                const daysPassed = Number(currentDay) - Number(stake.lockedDay)
                const daysRemaining = Number(stake.stakedDays) - daysPassed
                const isActive = stake.unlockedDay === 0

                walletData.hsiStakes.push({
                  wallet: wallet.address,
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
              } catch (err) {
                console.error(`[v0] Error fetching HSI stake ${i}:`, err)
              }
            }
          } catch (err) {
            console.log(`[v0] No HSI stakes found for ${wallet.address}`)
          }

          // Fetch Ethereum HSI Stakes
          try {
            console.log(`[v0] Starting Ethereum HSI stakes fetch for ${wallet.address}`)

            const fetchEthereumHSI = async () => {
              const hsiEthContract = new ethers.Contract(
                HSI_MANAGER_ETHEREUM_ADDRESS,
                HSI_MANAGER_ABI,
                ethereumProvider,
              )
              const hexEthContract = new ethers.Contract(HEX_ETHEREUM_ADDRESS, HEX_STAKING_ABI, ethereumProvider)

              const hsiStakeCount = await hsiEthContract.stakeCount(wallet.address)
              console.log(`[v0] Ethereum HSI stakeCount: ${hsiStakeCount.toString()}`)

              if (Number(hsiStakeCount) === 0) {
                console.log(`[v0] No Ethereum HSI stakes detected for ${wallet.address}`)
                return
              }

              const currentDay = await hexEthContract.currentDay()
              console.log(`[v0] Ethereum currentDay: ${currentDay.toString()}`)

              for (let i = 0; i < Number(hsiStakeCount); i++) {
                try {
                  console.log(`[v0] Fetching Ethereum HSI stake ${i}`)
                  const stake = await hsiEthContract.stakeLists(wallet.address, i)
                  console.log(`[v0] Ethereum HSI stake ${i} loaded:`, stake)

                  const stakedHearts = ethers.formatUnits(stake.stakedHearts, 8)
                  const stakeShares = ethers.formatUnits(stake.stakeShares, 12)

                  const daysPassed = Number(currentDay) - Number(stake.lockedDay)
                  const daysRemaining = Number(stake.stakedDays) - daysPassed
                  const isActive = stake.unlockedDay === 0

                  walletData.hsiStakes.push({
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
                    isAutoStake: stake.isAutoStake,
                    isActive,
                  })
                } catch (err) {
                  console.error(`[v0] Error fetching Ethereum HSI stake ${i}:`, err)
                }
              }
            }

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Ethereum HSI fetch timed out")), ETHEREUM_TIMEOUT),
            )
            await Promise.race([fetchEthereumHSI(), timeoutPromise])
            console.log(`[v0] Finished fetching Ethereum HSI stakes for ${wallet.address}`)
          } catch (err: any) {
            if (err.message === "Ethereum HSI fetch timed out") {
              console.log(`[v0] Ethereum HSI stakes fetch timed out for ${wallet.address}`)
            } else {
              console.log(`[v0] Ethereum HSI contract not accessible for ${wallet.address} (this is expected)`)
            }
          }
          return walletData
        } catch (err) {
          console.error(`[v0] Error processing wallet ${wallet.address}:`, err)
          // Return an empty walletData object or handle error as needed
          return {
            address: wallet.address,
            plsBalance: BigInt(0),
            tokens: [],
            lpPositions: [],
            liquidLoansVault: null,
            hexStakes: [],
            hsiStakes: [],
          }
        }
      })

      // UPDATED: Update loading stage for aggregating data
      setLoadingStage("Aggregating portfolio data...")

      // Wait for all wallet data to be fetched in parallel
      const allWalletData = await Promise.all(walletDataPromises)
      console.log("[v0] All wallet data fetched in parallel")

      let totalPLS = ethers.parseEther("0")
      let totalLockedPLS = ethers.parseEther("0")
      let totalDebt = ethers.parseEther("0")
      const tokenBalances: any[] = []
      const allLPPositions: any[] = []
      const allHexStakesAggregated: any[] = []
      const allHsiStakesAggregated: any[] = []
      const liquidLoansVaults: any[] = []

      for (const walletData of allWalletData) {
        // Aggregate PLS balance
        totalPLS = totalPLS + walletData.plsBalance

        // Aggregate tokens
        for (const token of walletData.tokens) {
          const existing = tokenBalances.find((t) => t.address.toLowerCase() === token.address.toLowerCase())
          if (existing) {
            existing.value += token.value
          } else {
            tokenBalances.push({ ...token })
          }
        }

        // Aggregate LP positions
        for (const lp of walletData.lpPositions) {
          const sorted = [lp.token0.address, lp.token1.address].sort()
          const pairId = `${sorted[0]}-${sorted[1]}`
          const pairKey = `${pairId}-${lp.factory}`

          const existing = allLPPositions.find((l) => {
            const existingSorted = [l.token0.address, l.token1.address].sort()
            const existingPairId = `${existingSorted[0]}-${existingSorted[1]}`
            const existingPairKey = `${existingPairId}-${l.factory}`
            return existingPairKey === pairKey
          })

          const lpValue = Number(lp.value) || 0
          const lpBalance = String(lp.balance || "0")

          if (existing) {
            existing.value = (Number(existing.value) || 0) + lpValue
            existing.balance = (Number.parseFloat(existing.balance || "0") + Number.parseFloat(lpBalance)).toString()
            if (lp.isFarm) {
              existing.isFarm = true
              existing.pendingInc = (Number(existing.pendingInc) || 0) + Number(lp.pendingInc || 0)
              existing.pendingIncUsdValue =
                (Number(existing.pendingIncUsdValue) || 0) + Number(lp.pendingIncUsdValue || 0)
            }
          } else {
            allLPPositions.push({
              ...lp,
              pairId,
              pairKey,
              value: lpValue,
              balance: lpBalance,
            })
          }
        }

        // Aggregate Liquid Loans
        if (walletData.liquidLoansVault) {
          liquidLoansVaults.push(walletData.liquidLoansVault)
          totalLockedPLS = totalLockedPLS + walletData.liquidLoansVault.lockedPLSBigInt
          totalDebt = totalDebt + walletData.liquidLoansVault.debtBigInt
        }

        // Aggregate HEX stakes
        allHexStakesAggregated.push(...walletData.hexStakes)

        // Aggregate HSI stakes
        allHsiStakesAggregated.push(...walletData.hsiStakes)
      }

      console.log("[LP] Final aggregated LP positions:", allLPPositions)
      setLpPositions(allLPPositions)

      const sortedHexStakes = allHexStakesAggregated.sort((a, b) => a.daysRemaining - b.daysRemaining)
      setHexStakes(sortedHexStakes)

      const sortedHsiStakes = allHsiStakesAggregated.sort((a, b) => a.daysRemaining - b.daysRemaining)
      setHsiStakes(sortedHsiStakes)
      setHsiCount(sortedHsiStakes.length)

      const portfolioData = {
        totalPLS: ethers.formatEther(totalPLS),
        totalLockedPLS: ethers.formatEther(totalLockedPLS),
        totalDebt: ethers.formatEther(totalDebt),
        walletCount: filteredWallets.length,
        tokenBalances: tokenBalances.filter((t) => t.value > 0),
        liquidLoansVaults,
      }

      setData(portfolioData)
    } catch (err) {
      setError("The data seems shy — try again in a moment.")
      console.error(err)
    } finally {
      setDataLoading(false)
      // CLEARED LOADING STAGE
      setLoadingStage("")
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-[#f1f1f1] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-medium">
            {data && totalPortfolioValue > 0
              ? `$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "My portfolio"}
          </h1>
          <div className="flex gap-3">
            <button
              className="px-5 py-2.5 text-sm bg-[#7028E4] hover:bg-[#5c1fc7] text-white rounded-xl transition-all font-semibold"
              onClick={() => setShowManageModal(true)}
            >
              Manage your wallets
            </button>
            <button
              className="px-5 py-2.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-xl transition-all font-semibold"
              onClick={() => setShowLoadModal(true)}
            >
              Got a portfolio ID? Load it here
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

          {dataLoading && !data && (
            <div className="space-y-6">
              {/* ADDED: Loading message above skeletons */}
              {loadingStage && (
                <div className="bg-card p-6 border border-card rounded-2xl text-center">
                  <p className="text-muted-foreground text-lg">{loadingStage}</p>
                </div>
              )}

              {/* Portfolio Overview Skeleton */}
              <div className="bg-card p-6 border border-card rounded-2xl">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </div>

              {/* Tokens Skeleton */}
              <div className="bg-card p-6 border border-card rounded-2xl">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </div>

              {/* LP Tokens Skeleton */}
              <div className="bg-card p-6 border border-card rounded-2xl">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </div>

              {/* HEX Stakes Skeleton */}
              <div className="bg-card p-6 border border-card rounded-2xl">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </div>
            </div>
          )}

          {!dataLoading && data && (
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

                {featuredTokenBalances
                  .filter((token) => {
                    const price = tokenPrices[token.address.toLowerCase()] || 0
                    const value = Number(token.balance) * price
                    return value >= 1 // Only show tokens with $1 or more in value
                  })
                  .map((token) => {
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
                              <span className="text-white font-mono text-sm">
                                ${price.toFixed(price < 0.01 ? 8 : 2)}
                              </span>
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
                          {formatLargeNumber(Number(token.balance), getDecimalPlaces(token.symbol))}
                        </span>
                        <span className="text-white font-mono text-right">
                          {price > 0
                            ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </span>
                      </div>
                    )
                  })}

                {alwaysVisibleTokenBalances.length > 0 && (
                  <>
                    <div className="mt-6 pt-4 border-t border-[#27272a]">
                      <h4 className="text-sm font-semibold text-[#a1a1aa] mb-3">Opus and Coda</h4>
                    </div>

                    {alwaysVisibleTokenBalances.map((token) => {
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
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=24&width=24"
                              }}
                            />
                            <span className="text-white">{token.name}</span>
                          </div>
                          <div className="text-right">
                            {price > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="text-white font-mono text-sm">
                                  ${price.toFixed(price < 0.01 ? 8 : 2)}
                                </span>
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
                            {formatLargeNumber(Number(token.balance), getDecimalPlaces(token.symbol))}
                          </span>
                          <span className="text-white font-mono text-right">
                            {price > 0
                              ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : "—"}
                          </span>
                        </div>
                      )
                    })}
                  </>
                )}

                {ogwebchefTokenBalances.length > 0 && (
                  <>
                    <div className="mt-6 pt-4 border-t border-[#27272a]">
                      <h4 className="text-sm font-semibold text-[#a1a1aa] mb-3">OGWebChef tokens</h4>
                    </div>

                    {ogwebchefTokenBalances
                      .filter((token) => {
                        const price = tokenPrices[token.address.toLowerCase()] || 0
                        const value = Number(token.balance) * price
                        if (token.address.toLowerCase() === "0x041a80b38d3a5b4dbb30e56440ca8f0c8dfa6412") {
                          console.log(`[v0] SⒶVⒶNT balance: ${token.balance}, price: ${price}, value: ${value}`)
                        }
                        return value >= 1 // Only show tokens with $1 or more in value
                      })
                      .sort((a, b) => {
                        const priceA = tokenPrices[a.address.toLowerCase()] || 0
                        const priceB = tokenPrices[b.address.toLowerCase()] || 0
                        const valueA = Number(a.balance) * priceA
                        const valueB = Number(b.balance) * priceB
                        return valueB - valueA // Sort by value descending
                      })
                      .map((token) => {
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
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=24&width=24"
                                }}
                              />
                              <span className="text-white">{token.name}</span>
                            </div>
                            <div className="text-right">
                              {price > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-white font-mono text-sm">
                                    ${price.toFixed(price < 0.01 ? 8 : 2)}
                                  </span>
                                  {priceChange !== undefined && priceChange !== 0 && (
                                    <span
                                      className={`text-xs font-mono ${priceChange >= 0 ? "text-gain" : "text-loss"}`}
                                    >
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
                              {formatLargeNumber(Number(token.balance), getDecimalPlaces(token.symbol))}
                            </span>
                            <span className="text-white font-mono text-right">
                              {price > 0
                                ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "—"}
                            </span>
                          </div>
                        )
                      })}
                  </>
                )}
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
                <div className="bg-card border border-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#27272a]">
                    <h3 className="text-lg font-semibold">LP Positions</h3>
                    <span className="text-sm text-[#a1a1aa]">
                      {lpPositions.length} position{lpPositions.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-[minmax(150px,1.5fr)_2fr_1fr_1fr] gap-6 pb-3 mb-3 border-b border-[#27272a]">
                    <div className="text-sm font-semibold text-[#a1a1aa]">LP Token</div>
                    <div className="text-sm font-semibold text-[#a1a1aa]">Token Amounts</div>
                    <div className="text-sm font-semibold text-[#a1a1aa] text-right">Pool Share</div>
                    <div className="text-sm font-semibold text-[#a1a1aa] text-right">USD Value</div>
                  </div>

                  {lpPositions
                    .sort((a, b) => b.value - a.value)
                    .map((lp: any, index: number) => {
                      if (lp.isStableSwap) {
                        return (
                          <div
                            key={lp.pairId}
                            className="grid grid-cols-[minmax(150px,1.5fr)_2fr_1fr_1fr] gap-6 items-center py-3 border-b border-[#27272a] last:border-0"
                          >
                            {/* LP Token column with triangle logo layout */}
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12">
                                {/* Triangle layout: one on top, two below */}
                                <img
                                  src={getTokenLogo(lp.token0.address) || "/placeholder.svg"}
                                  alt={lp.token0.symbol}
                                  className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full border-2 border-background z-30"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=28&width=28"
                                  }}
                                />
                                <img
                                  src={getTokenLogo(lp.token1.address) || "/placeholder.svg"}
                                  alt={lp.token1.symbol}
                                  className="absolute bottom-0 left-0 w-7 h-7 rounded-full border-2 border-background z-20"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=28&width=28"
                                  }}
                                />
                                <img
                                  src={getTokenLogo(lp.token2.address) || "/placeholder.svg"}
                                  alt={lp.token2.symbol}
                                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-2 border-background z-10"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=28&width=28"
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-medium">{lp.name}</div>
                                <div className="text-xs text-[#a1a1aa]">PulseX {lp.factory}</div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-sm">
                                {lp.token0.amount.toFixed(2)} {lp.token0.symbol}
                              </div>
                              <div className="text-sm">
                                {lp.token1.amount.toFixed(2)} {lp.token1.symbol}
                              </div>
                              <div className="text-sm">
                                {lp.token2.amount.toFixed(2)} {lp.token2.symbol}
                              </div>
                            </div>

                            {/* Pool Share column */}
                            <div className="text-right">
                              <div className="text-sm font-medium text-yellow-500">{lp.poolShare.toFixed(4)}%</div>
                            </div>

                            {/* USD Value column */}
                            <div className="text-right">
                              <div className="text-sm font-medium">${lp.value.toLocaleString()}</div>
                            </div>
                          </div>
                        )
                      }

                      // Regular 2-token LP positions
                      return (
                        <div
                          key={lp.pairId}
                          className="grid grid-cols-[minmax(150px,1.5fr)_2fr_1fr_1fr] gap-6 items-center py-3 border-b border-[#27272a] last:border-0"
                        >
                          {/* LP Token column */}
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-8">
                              <img
                                src={getTokenLogo(lp.token0.address) || "/placeholder.svg"}
                                alt={lp.token0.symbol}
                                className="absolute left-0 w-8 h-8 rounded-full border-2 border-background z-10"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                                }}
                              />
                              <img
                                src={getTokenLogo(lp.token1.address) || "/placeholder.svg"}
                                alt={lp.token1.symbol}
                                className="absolute left-5 w-8 h-8 rounded-full border-2 border-background"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{lp.name}</div>
                              <div className="text-xs text-[#a1a1aa]">PulseX {lp.factory}</div>
                            </div>
                          </div>

                          {/* Token Amounts column */}
                          <div className="space-y-1">
                            <div className="text-sm">
                              {lp.token0.amount.toFixed(2)} {lp.token0.symbol}
                            </div>
                            <div className="text-sm">
                              {lp.token1.amount.toFixed(2)} {lp.token1.symbol}
                            </div>
                            {lp.isFarm && lp.pendingInc > 0 && (
                              <div className="text-xs text-green-500">
                                +{lp.pendingInc.toFixed(4)} INC (${lp.pendingIncUsdValue.toFixed(2)})
                              </div>
                            )}
                          </div>

                          {/* Pool Share column */}
                          <div className="text-right">
                            <div className="text-sm font-medium text-yellow-500">{lp.poolShare.toFixed(4)}%</div>
                          </div>

                          {/* USD Value column */}
                          <div className="text-right">
                            <div className="text-sm font-medium">${lp.value.toLocaleString()}</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {hexStakes.length > 0 && (
                <PortfolioCard
                  title="HEX Stakes"
                  total={(() => {
                    const hexPulsechainPrice = tokenPrices[HEX_PULSECHAIN_ADDRESS.toLowerCase()] || 0
                    const hexEthereumPrice = tokenPrices[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] || 0

                    const totalHexAmount = hexStakes.reduce((sum, stake) => sum + stake.stakedHearts, 0)
                    const totalValue = hexStakes.reduce((sum, stake) => {
                      const hexPrice = stake.chain === "Ethereum" ? hexEthereumPrice : hexPulsechainPrice
                      return sum + stake.stakedHearts * hexPrice
                    }, 0)

                    const avgStakeLength = (
                      hexStakes.reduce((sum, stake) => sum + stake.stakedDays, 0) / hexStakes.length
                    ).toFixed(0)
                    const totalTShares = hexStakes
                      .reduce((sum, stake) => sum + stake.stakeShares, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                    return `${totalTShares} T-shares | ${hexStakes.length} stake${hexStakes.length > 1 ? "s" : ""} | Average length: ${avgStakeLength} days | Total: ${totalHexAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} HEX / $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  })()}
                  totalLabel=""
                  items={(() => {
                    const pulsechainStakes = hexStakes.filter((s) => s.chain === "Pulsechain")
                    const ethereumStakes = hexStakes.filter((s) => s.chain === "Ethereum")
                    const hexPulsechainPrice = tokenPrices[HEX_PULSECHAIN_ADDRESS.toLowerCase()] || 0
                    const hexEthereumPrice = tokenPrices[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] || 0

                    const createStakeItem = (stake: any) => {
                      const hexPrice = stake.chain === "Ethereum" ? hexEthereumPrice : hexPulsechainPrice
                      const usdValue = stake.stakedHearts * hexPrice
                      return {
                        label: `Day ${stake.daysPassed}/${stake.stakedDays} (${stake.daysRemaining} days left) — Staked HEX ${stake.stakedHearts.toLocaleString(undefined, { maximumFractionDigits: 0 })} — ${stake.stakeShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares — ${stake.wallet.slice(0, 4)}…${stake.wallet.slice(-4)}`,
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
                        label: "Pulsechain Stakes",
                        value: "",
                        valueColor: "text-[#a1a1aa] text-base font-semibold",
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
                        valueColor: "text-[#a1a1aa] text-base font-semibold",
                      })
                      items.push(...ethereumStakes.map(createStakeItem))
                    }

                    return items
                  })()}
                />
              )}

              <PortfolioCard
                title="HSI Stakes"
                total={
                  hsiStakes.length > 0
                    ? (() => {
                        const hexPulsechainPrice = tokenPrices[HEX_PULSECHAIN_ADDRESS.toLowerCase()] || 0
                        const hexEthereumPrice = tokenPrices[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] || 0

                        const totalHexAmount = hsiStakes.reduce((sum, stake) => sum + stake.stakedHearts, 0)
                        const totalValue = hsiStakes.reduce((sum, stake) => {
                          const hexPrice = stake.chain === "Ethereum" ? hexEthereumPrice : hexPulsechainPrice
                          return sum + stake.stakedHearts * hexPrice
                        }, 0)

                        const avgStakeLength = (
                          hsiStakes.reduce((sum, stake) => sum + stake.stakedDays, 0) / hsiStakes.length
                        ).toFixed(0)
                        const totalTShares = hsiStakes
                          .reduce((sum, stake) => sum + stake.stakeShares, 0)
                          .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                        return `${totalTShares} T-shares | ${hsiStakes.length} HSI${hsiStakes.length > 1 ? "s" : ""} | Average length: ${avgStakeLength} days | Total: ${totalHexAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} HEX / $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      })()
                    : "No HSI stakes found"
                }
                totalLabel=""
                items={
                  hsiStakes.length > 0
                    ? (() => {
                        const pulsechainHSI = hsiStakes.filter((s) => s.chain === "Pulsechain")
                        const ethereumHSI = hsiStakes.filter((s) => s.chain === "Ethereum")
                        const hexPulsechainPrice = tokenPrices[HEX_PULSECHAIN_ADDRESS.toLowerCase()] || 0
                        const hexEthereumPrice = tokenPrices[`eth_${HEX_ETHEREUM_ADDRESS.toLowerCase()}`] || 0

                        const createHSIItem = (stake: any) => {
                          const hexPrice = stake.chain === "Ethereum" ? hexEthereumPrice : hexPulsechainPrice
                          const usdValue = stake.stakedHearts * hexPrice
                          return {
                            label: `Day ${stake.daysPassed}/${stake.stakedDays} (${stake.daysRemaining} days left) — Staked HEX ${stake.stakedHearts.toLocaleString(undefined, { maximumFractionDigits: 0 })} — ${stake.stakeShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} T-shares${stake.isAutoStake ? " (Auto)" : ""} — ${stake.wallet.slice(0, 4)}…${stake.wallet.slice(-4)}`,
                            value:
                              hexPrice > 0
                                ? `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "—",
                            valueColor: stake.isActive ? "text-gain" : "text-neutral",
                          }
                        }

                        const items = []

                        if (pulsechainHSI.length > 0) {
                          items.push({
                            label: "Pulsechain HSI Stakes",
                            value: "",
                            valueColor: "text-[#a1a1aa] text-base font-semibold",
                          })
                          items.push(...pulsechainHSI.map(createHSIItem))
                        }

                        if (ethereumHSI.length > 0) {
                          if (pulsechainHSI.length > 0) {
                            items.push({
                              label: "",
                              value: "",
                              valueColor: "text-transparent",
                            })
                          }
                          items.push({
                            label: "Ethereum HSI Stakes",
                            value: "",
                            valueColor: "text-[#a1a1aa] text-base font-semibold",
                          })
                          items.push(...ethereumHSI.map(createHSIItem))
                        }

                        return items
                      })()
                    : []
                }
              />

              {data.liquidLoansVaults && data.liquidLoansVaults.length > 0 && (
                <PortfolioCard
                  title="Liquid Loans"
                  totalLeft={{
                    label: "Total Locked PLS",
                    value: Number.parseFloat(data.totalLockedPLS).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }),
                  }}
                  totalRight={{
                    label: "Total Debt (USDL)",
                    value: Number.parseFloat(data.totalDebt).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  }}
                  items={data.liquidLoansVaults.map((vault: any) => ({
                    label: `${vault.wallet.slice(0, 6)}...${vault.wallet.slice(-4)} — Locked: ${Number.parseFloat(vault.lockedPLS).toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS`,
                    value: `Debt: ${Number.parseFloat(vault.debt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDL`,
                  }))}
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
