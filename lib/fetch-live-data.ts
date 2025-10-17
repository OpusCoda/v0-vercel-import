const PULSEX_SUBGRAPH = "https://graph.pulsechain.com/subgraphs/name/pulsechain/pulsex"
const PULSESCAN_API = "https://api.scan.pulsechain.com/api"

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

// Fetch LP positions via PulseX subgraph
export async function fetchLPPositions(address: string) {
  try {
    const query = `
      query($owner: String!) {
        liquidityPositions(where: { user: $owner }) {
          id
          pair {
            id
            token0 { symbol }
            token1 { symbol }
            reserve0
            reserve1
            totalSupply
          }
          liquidityTokenBalance
        }
      }
    `
    const resp = await fetchGraphQL(query, { owner: address.toLowerCase() })

    if (!resp || !resp.liquidityPositions) {
      return []
    }

    return resp.liquidityPositions.map((lp: any) => {
      const lpValue =
        (Number(lp.liquidityTokenBalance) / Number(lp.pair.totalSupply)) *
        (Number(lp.pair.reserve0) + Number(lp.pair.reserve1))
      return {
        name: `${lp.pair.token0.symbol}/${lp.pair.token1.symbol}`,
        value: lpValue,
        pairId: lp.pair.id,
      }
    })
  } catch (error) {
    console.error("Error fetching LP positions:", error)
    return []
  }
}
