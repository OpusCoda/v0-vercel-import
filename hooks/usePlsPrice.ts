import { useEffect, useState } from 'react'

// Live USD price for a PulseChain token from DexScreener (free, no key).
// Pass the token label ('PLS','PLSX','HEX','INC'); returns price or null.
// Display only — bets resolve via the Fetch Oracle, not this.
const PAIRS: Record<string, string> = {
  // DexScreener pair addresses on PulseChain (WPLS-quoted majors).
  // Replace with your preferred pairs if you want different liquidity sources.
  PLS: '0xe56043671df55de5cdf8459710433c10324de0ae',  // WPLS/DAI
  PLSX: '0x1b45b9148791d3a104184cd5dfe5ce57193a3ee9', // PLSX/WPLS
  HEX: '0xf1f4ee610b2babb05c635f726ef8b0c568c8dc65',  // HEX/WPLS
  INC: '0xf808bb6265e9ca27002c0a04562bf50d4fe37eaa',  // INC/WPLS
  SMAUG: '0x151e583badb57138d41aa964ac3ff38d4bb1145f', // SMAUG/WPLS
}

export function usePlsPrice(tokenLabel?: string) {
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    if (!tokenLabel) return
    const pair = PAIRS[tokenLabel]
    if (!pair) { setPrice(null); return }
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${pair}`)
        const json = await res.json()
        const usd = json?.pair?.priceUsd ?? json?.pairs?.[0]?.priceUsd
        if (!cancelled) setPrice(usd ? Number(usd) : null)
      } catch {
        if (!cancelled) setPrice(null)
      }
    }
    load()
    const id = setInterval(load, 60000)
    return () => { cancelled = true; clearInterval(id) }
  }, [tokenLabel])

  return price
}