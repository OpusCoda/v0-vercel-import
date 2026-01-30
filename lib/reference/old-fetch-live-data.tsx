import { ethers } from "ethers"

const PULSEX_SUBGRAPH = "https://graph.pulsechain.com/subgraphs/name/pulsechain/pulsex"
const PULSESCAN_API = "https://api.scan.pulsechain.com/api"

const PULSEX_V1_FACTORY = "0x1715a3E4A142d8b698131108995174F37aEBA10D"
const PULSEX_V2_FACTORY = "0x29eA7545DEf87022BAdc76323F373EA1e707C523"
const PULSEX_V1_MASTERCHEF = "0xB2Ca4A66d3e57a5a9A12043B6bAD28249fE302d4"
const STABLESWAP_3POOL = "0xE3acFA6C40d53C3faf2aa62D0a715C737071511c"

const V2_FACTORY_ABI = ["function getPair(address tokenA, address tokenB) external view returns (address pair)"]

const LP_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
]

const MASTERCHEF_ABI = [
  "function poolLength() view returns (uint256)",
  "function userInfo(uint256 pid, address user) view returns (uint256 amount, uint256 rewardDebt)",
  "function poolInfo(uint256 pid) view returns (address lpToken, uint256, uint256, uint256)",
  "function pendingInc(uint256 pid, address user) view returns (uint256)",
]

const STABLESWAP_ABI = [
  "function token() view returns (address)", // Added function to get LP token address
  "function balances(uint256 i) view returns (uint256)",
  "function get_virtual_price() view returns (uint256)",
]

const ERC20_ABI = ["function decimals() view returns (uint8)", "function symbol() view returns (string)"]

// Common token addresses on Pulsechain
const WPLS = "0xA1077a294dDE1B09bB078844df40758a5D0f9a27"
const WETH = "0x02dcdd04e3f455d838cd1249292c58f3b79e3c3c"
const HEX = "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39"
const PLSX = "0x95b303987a60c71504d99aa1b13b4da07b0790ab"
const INC = "0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d"
const OPUS = "0xbdE852ef424Aa15B83b8Eb6442Dc0C165d2E63F4"
const CODA = "0xDC3262de8d7DE75f6A58304475C8cf3950626F7e"
const DAI = "0xefD766cCb38EaF1dfd701853BFCe31359239F305"
const USDC = "0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07"
const USDT = "0x0Cb6F5a34ad42ec934882A05265A7d5F59b51A2f"

// Common trading pairs to check
const COMMON_PAIRS = [
  { tokenA: WPLS, tokenB: WETH, name: "PLS/WETH" },
  { tokenA: WPLS, tokenB: HEX, name: "PLS/HEX" },
  { tokenA: WPLS, tokenB: PLSX, name: "PLS/PLSX" },
  { tokenA: WPLS, tokenB: INC, name: "PLS/INC" },
  { tokenA: WPLS, tokenB: OPUS, name: "PLS/OPUS" },
  { tokenA: WPLS, tokenB: CODA, name: "PLS/CODA" },
  { tokenA: WETH, tokenB: HEX, name: "WETH/HEX" },
  { tokenA: PLSX, tokenB: HEX, name: "PLSX/HEX" },
  { tokenA: PLSX, tokenB: INC, name: "PLSX/INC" },
  { tokenA: HEX, tokenB: INC, name: "HEX/INC" },
  { tokenA: OPUS, tokenB: CODA, name: "OPUS/CODA" },
]

function getPulseXV1PairAddress(tokenA: string, tokenB: string): string {
  // Sort tokens: lower address first
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]

  // Create salt from sorted token addresses
  const salt = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address", "address"], [token0, token1]))

  // PulseX V1 pair bytecode hash
  const initCodeHash = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"

  // Compute create2 address
  const pairAddress = ethers.getCreate2Address(PULSEX_V1_FACTORY, salt, initCodeHash)

  return pairAddress
}

// Helper for GraphQL queries
async function fetchGraphQL(query: string, variables = {}) {
  const resp = await fetch(PULSEX_SUBGRAPH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await resp.json()
  return json.data
}

// Fetch all token holdings for an address using PulseScan API
export async function fetchPulseAssets(address: string) {
  try {
    const url = `${PULSESCAN_API}?module=account&action=tokenlist&address=${address}`
    const resp = await fetch(url)
    const j = await resp.json()

    if (j.status !== "1" || !j.result) {
      return []
    }

    const tokens = j.result || []
    return tokens.map((t: any) => ({
      name: t.name || t.tokenSymbol,
      symbol: t.tokenSymbol,
      value: Number(t.balance) / 10 ** Number(t.tokenDecimal),
      decimals: Number(t.tokenDecimal),
      address: t.contractAddress,
    }))
  } catch (error) {
    console.error("Error fetching pulse assets:", error)
    return []
  }
}

export async function fetchLPPositions(address: string, tokenPrices: Record<string, number> = {}) {
  try {
    console.log(`[v0] Fetching ALL LP positions for ${address}`)

    const provider = new ethers.JsonRpcProvider("https://rpc.pulsechain.com")
    const MIN_USD_VALUE = 1
    const lpPositions: any[] = []

    console.log(`[v0] Checking common pairs in both V1 and V2 factories`)
    const v1Factory = new ethers.Contract(PULSEX_V1_FACTORY, V2_FACTORY_ABI, provider)
    const v2Factory = new ethers.Contract(PULSEX_V2_FACTORY, V2_FACTORY_ABI, provider)

    for (const pair of COMMON_PAIRS) {
      try {
        const v1PairAddress = await v1Factory.getPair(pair.tokenA, pair.tokenB)
        if (v1PairAddress !== ethers.ZeroAddress) {
          const pairContract = new ethers.Contract(v1PairAddress, LP_ABI, provider)

          try {
            const balance = await pairContract.balanceOf(address)
            console.log(`[v0] V1 ${pair.name} - Pair: ${v1PairAddress}, Balance: ${ethers.formatUnits(balance, 18)}`)

            if (balance > 0) {
              const [reserves, totalSupply, token0Address, token1Address] = await Promise.all([
                pairContract.getReserves(),
                pairContract.totalSupply(),
                pairContract.token0(),
                pairContract.token1(),
              ])

              const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider)
              const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider)

              const [token0Symbol, token1Symbol, token0Decimals, token1Decimals] = await Promise.all([
                token0Contract.symbol(),
                token1Contract.symbol(),
                token0Contract.decimals(),
                token1Contract.decimals(),
              ])

              const userShare = Number(ethers.formatUnits(balance, 18)) / Number(ethers.formatUnits(totalSupply, 18))
              const poolSharePercentage = userShare * 100

              const reserve0 = Number(ethers.formatUnits(reserves.reserve0, token0Decimals))
              const reserve1 = Number(ethers.formatUnits(reserves.reserve1, token1Decimals))

              const userToken0 = reserve0 * userShare
              const userToken1 = reserve1 * userShare

              const token0Price = tokenPrices[token0Address.toLowerCase()] || 0
              const token1Price = tokenPrices[token1Address.toLowerCase()] || 0

              if (token0Price === 0 && token1Price === 0) {
                console.log(`[v0] Skipping ${token0Symbol}/${token1Symbol} V1 - both tokens have $0 price`)
                continue
              }

              const usdValue = userToken0 * token0Price + userToken1 * token1Price

              if (usdValue >= MIN_USD_VALUE) {
                console.log(
                  `[v0] Adding V1 LP position: ${token0Symbol}/${token1Symbol} - USD Value: $${usdValue.toFixed(2)}`,
                )

                lpPositions.push({
                  name: `${token0Symbol}/${token1Symbol}`,
                  pairAddress: v1PairAddress,
                  factory: "V1",
                  balance: ethers.formatUnits(balance, 18),
                  poolShare: poolSharePercentage,
                  token0: {
                    address: token0Address,
                    symbol: token0Symbol,
                    amount: userToken0,
                    price: token0Price,
                  },
                  token1: {
                    address: token1Address,
                    symbol: token1Symbol,
                    amount: userToken1,
                    price: token1Price,
                  },
                  value: usdValue,
                  pairId: v1PairAddress.toLowerCase(),
                })
              }
            }
          } catch (v1Error) {
            console.log(`[v0] V1 ${pair.name} - Error checking balance:`, v1Error)
          }
        }

        // Check V2
        const v2PairAddress = await v2Factory.getPair(pair.tokenA, pair.tokenB)
        if (v2PairAddress !== ethers.ZeroAddress) {
          const pairContract = new ethers.Contract(v2PairAddress, LP_ABI, provider)
          const balance = await pairContract.balanceOf(address)

          console.log(`[v0] V2 ${pair.name} - Pair: ${v2PairAddress}, Balance: ${ethers.formatUnits(balance, 18)}`)

          if (balance > 0) {
            const [reserves, totalSupply, token0Address, token1Address] = await Promise.all([
              pairContract.getReserves(),
              pairContract.totalSupply(),
              pairContract.token0(),
              pairContract.token1(),
            ])

            const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider)
            const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider)

            const [token0Symbol, token1Symbol, token0Decimals, token1Decimals] = await Promise.all([
              token0Contract.symbol(),
              token1Contract.symbol(),
              token0Contract.decimals(),
              token1Contract.decimals(),
            ])

            const userShare = Number(ethers.formatUnits(balance, 18)) / Number(ethers.formatUnits(totalSupply, 18))
            const poolSharePercentage = userShare * 100

            const reserve0 = Number(ethers.formatUnits(reserves.reserve0, token0Decimals))
            const reserve1 = Number(ethers.formatUnits(reserves.reserve1, token1Decimals))

            const userToken0 = reserve0 * userShare
            const userToken1 = reserve1 * userShare

            const token0Price = tokenPrices[token0Address.toLowerCase()] || 0
            const token1Price = tokenPrices[token1Address.toLowerCase()] || 0

            if (token0Price === 0 && token1Price === 0) {
              console.log(`[v0] Skipping ${token0Symbol}/${token1Symbol} V2 - both tokens have $0 price`)
              continue
            }

            const usdValue = userToken0 * token0Price + userToken1 * token1Price

            if (usdValue >= MIN_USD_VALUE) {
              console.log(
                `[v0] Adding V2 LP position: ${token0Symbol}/${token1Symbol} - USD Value: $${usdValue.toFixed(2)}`,
              )

              lpPositions.push({
                name: `${token0Symbol}/${token1Symbol}`,
                pairAddress: v2PairAddress,
                factory: "V2",
                balance: ethers.formatUnits(balance, 18),
                poolShare: poolSharePercentage,
                token0: {
                  address: token0Address,
                  symbol: token0Symbol,
                  amount: userToken0,
                  price: token0Price,
                },
                token1: {
                  address: token1Address,
                  symbol: token1Symbol,
                  amount: userToken1,
                  price: token1Price,
                },
                value: usdValue,
                pairId: v2PairAddress.toLowerCase(),
              })
            }
          }
        }
      } catch (err) {
        console.error(`[v0] Error checking pair ${pair.name}:`, err)
      }
    }

    console.log(`[v0] Checking V1 farm positions`)
    try {
      const masterChef = new ethers.Contract(PULSEX_V1_MASTERCHEF, MASTERCHEF_ABI, provider)
      const poolLength = await masterChef.poolLength()
      console.log(`[v0] Found ${poolLength} farm pools`)

      for (let pid = 0; pid < Number(poolLength); pid++) {
        try {
          const userInfo = await masterChef.userInfo(pid, address)
          const stakedAmount = userInfo.amount

          if (stakedAmount > 0) {
            const pendingRewards = await masterChef.pendingInc(pid, address)
            const pendingIncAmount = Number(ethers.formatUnits(pendingRewards, 18))

            const poolInfo = await masterChef.poolInfo(pid)
            const lpTokenAddress = poolInfo.lpToken

            const lpContract = new ethers.Contract(lpTokenAddress, LP_ABI, provider)
            const [reserves, totalSupply, token0Address, token1Address] = await Promise.all([
              lpContract.getReserves(),
              lpContract.totalSupply(),
              lpContract.token0(),
              lpContract.token1(),
            ])

            const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider)
            const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider)

            const [token0Symbol, token1Symbol, token0Decimals, token1Decimals] = await Promise.all([
              token0Contract.symbol(),
              token1Contract.symbol(),
              token0Contract.decimals(),
              token1Contract.decimals(),
            ])

            const userShare = Number(ethers.formatUnits(stakedAmount, 18)) / Number(ethers.formatUnits(totalSupply, 18))
            const poolSharePercentage = userShare * 100

            const reserve0 = Number(ethers.formatUnits(reserves.reserve0, token0Decimals))
            const reserve1 = Number(ethers.formatUnits(reserves.reserve1, token1Decimals))

            const userToken0 = reserve0 * userShare
            const userToken1 = reserve1 * userShare

            const token0Price = tokenPrices[token0Address.toLowerCase()] || 0
            const token1Price = tokenPrices[token1Address.toLowerCase()] || 0

            if (token0Price === 0 && token1Price === 0) {
              console.log(`[v0] Skipping farm ${token0Symbol}/${token1Symbol} - both tokens have $0 price`)
              continue
            }

            const usdValue = userToken0 * token0Price + userToken1 * token1Price

            const incPrice = tokenPrices[INC.toLowerCase()] || 0
            const pendingIncUsdValue = pendingIncAmount * incPrice

            if (usdValue >= MIN_USD_VALUE) {
              console.log(
                `[v0] Adding V1 FARM position: ${token0Symbol}/${token1Symbol} - USD Value: $${usdValue.toFixed(2)}, Pending INC: ${pendingIncAmount.toFixed(4)} ($${pendingIncUsdValue.toFixed(2)})`,
              )

              lpPositions.push({
                name: `${token0Symbol}/${token1Symbol}`,
                pairAddress: lpTokenAddress,
                factory: "V1 Farm",
                balance: ethers.formatUnits(stakedAmount, 18),
                poolShare: poolSharePercentage,
                token0: {
                  address: token0Address,
                  symbol: token0Symbol,
                  amount: userToken0,
                  price: token0Price,
                },
                token1: {
                  address: token1Address,
                  symbol: token1Symbol,
                  amount: userToken1,
                  price: token1Price,
                },
                value: usdValue,
                pairId: lpTokenAddress.toLowerCase(),
                isFarm: true,
                pendingInc: pendingIncAmount,
                pendingIncUsdValue: pendingIncUsdValue,
              })
            }
          }
        } catch (poolError) {
          // Pool doesn't exist or error reading, skip silently
        }
      }
    } catch (farmError) {
      console.error(`[v0] Error checking farm positions:`, farmError)
    }

    console.log(`[v0] Checking StableSwap 3pool position`)
    try {
      const stableSwapContract = new ethers.Contract(STABLESWAP_3POOL, STABLESWAP_ABI, provider)

      const lpTokenAddress = await stableSwapContract.token()
      console.log(`[v0] StableSwap LP token address: ${lpTokenAddress}`)

      const lpTokenContract = new ethers.Contract(lpTokenAddress, LP_ABI, provider)
      const lpBalance = await lpTokenContract.balanceOf(address)

      if (lpBalance > 0) {
        console.log(`[v0] StableSwap 3pool - Balance: ${ethers.formatUnits(lpBalance, 18)}`)

        const [totalSupply, virtualPrice, balance0, balance1, balance2] = await Promise.all([
          lpTokenContract.totalSupply(),
          stableSwapContract.get_virtual_price(),
          stableSwapContract.balances(0), // DAI
          stableSwapContract.balances(1), // USDC
          stableSwapContract.balances(2), // USDT
        ])

        console.log(`[v0] StableSwap RAW balance0 (DAI): ${balance0.toString()}`)
        console.log(`[v0] StableSwap RAW balance1 (USDC): ${balance1.toString()}`)
        console.log(`[v0] StableSwap RAW balance2 (USDT): ${balance2.toString()}`)
        console.log(`[v0] StableSwap RAW totalSupply: ${totalSupply.toString()}`)
        console.log(`[v0] StableSwap RAW virtualPrice: ${virtualPrice.toString()}`)

        // Calculate user's share of the pool
        const userShare = Number(ethers.formatUnits(lpBalance, 18)) / Number(ethers.formatUnits(totalSupply, 18))
        const poolSharePercentage = userShare * 100

        // Virtual price is the price of 1 LP token in USD (with 18 decimals)
        const lpBalanceNum = Number(ethers.formatUnits(lpBalance, 18))
        const virtualPriceNum = Number(ethers.formatUnits(virtualPrice, 18))
        const usdValue = lpBalanceNum * virtualPriceNum

        console.log(`[v0] StableSwap balance0 formatted with 6 decimals: ${Number(ethers.formatUnits(balance0, 6))}`)
        console.log(`[v0] StableSwap balance1 formatted with 6 decimals: ${Number(ethers.formatUnits(balance1, 6))}`)
        console.log(`[v0] StableSwap balance2 formatted with 18 decimals: ${Number(ethers.formatUnits(balance2, 18))}`)

        // Fixed decimal formatting: DAI uses 6 decimals (normalized in StableSwap), USDC uses 6 decimals (native), USDT uses 18 decimals (normalized in StableSwap)
        const daiAmount = Number(ethers.formatUnits(balance0, 6)) * userShare
        const usdcAmount = Number(ethers.formatUnits(balance1, 6)) * userShare
        const usdtAmount = Number(ethers.formatUnits(balance2, 18)) * userShare

        console.log(`[v0] StableSwap LP balance: ${lpBalanceNum}`)
        console.log(`[v0] StableSwap total supply: ${Number(ethers.formatUnits(totalSupply, 18))}`)
        console.log(`[v0] StableSwap user share: ${(userShare * 100).toFixed(4)}%`)
        console.log(`[v0] StableSwap virtual price: ${virtualPriceNum}`)
        console.log(`[v0] StableSwap calculated USD value: $${usdValue.toFixed(2)}`)
        console.log(`[v0] StableSwap user DAI: ${daiAmount.toFixed(2)}`)
        console.log(`[v0] StableSwap user USDC: ${usdcAmount.toFixed(2)}`)
        console.log(`[v0] StableSwap user USDT: ${usdtAmount.toFixed(2)}`)

        if (usdValue >= MIN_USD_VALUE) {
          console.log(`[v0] Adding StableSwap 3pool position - USD Value: $${usdValue.toFixed(2)}`)

          lpPositions.push({
            name: "DAI/USDC/USDT",
            pairAddress: lpTokenAddress,
            factory: "StableSwap",
            balance: ethers.formatUnits(lpBalance, 18),
            poolShare: poolSharePercentage,
            token0: {
              address: DAI,
              symbol: "DAI",
              amount: daiAmount,
              price: 1, // Stablecoins assumed 1:1 USD
            },
            token1: {
              address: USDC,
              symbol: "USDC",
              amount: usdcAmount,
              price: 1,
            },
            token2: {
              address: USDT,
              symbol: "USDT",
              amount: usdtAmount,
              price: 1,
            },
            value: usdValue,
            pairId: lpTokenAddress.toLowerCase(),
            isStableSwap: true,
          })
        }
      } else {
        console.log(`[v0] StableSwap 3pool - No balance found`)
      }
    } catch (stableSwapError) {
      console.error(`[v0] Error checking StableSwap 3pool:`, stableSwapError)
    }

    console.log(`[v0] Returning ${lpPositions.length} LP positions (including farms) with value >= $${MIN_USD_VALUE}`)
    return lpPositions
  } catch (error) {
    console.error("[v0] Error fetching LP positions:", error)
    return []
  }
}
