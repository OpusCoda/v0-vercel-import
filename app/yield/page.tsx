// app/yield/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { formatUnits, parseUnits, maxUint256, isAddress } from "viem"
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi"
import { SiteNav } from "@/components/landing/site-nav"
import { ConnectWalletButton } from "@/components/landing/connect-wallet-button"
import {
  VAULTS,
  VAULT_ABI,
  ERC20_ABI,
  PRINCIPALS,
  vaultsForPrincipal,
  formatTier,
  weightedCompoundPct,
  vaultShareOfCirculating,
  CIRCULATING_EXCLUSIONS,
  smaugForNextTier,
  timeAgo,
  COMPOUNDED_EVENT,
  SETTLED_EVENT,
  CLAIMED_EVENT,
  RELAY_ADDRESS,
  RELAY_ABI,
  type PrincipalKey,
  type VaultKey,
} from "@/lib/yield"

const COPPER = "#B87333"
const BORDER = "#25252e"
const BUY_TAX = 0.05
const SLIPPAGE = 0.03
const DEADLINE_SECONDS = 300
const NO_RELAY = RELAY_ADDRESS === "0x0000000000000000000000000000000000000000"

type Position = readonly [bigint, bigint, bigint, bigint, bigint, bigint, number]

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-[#2a2a35] bg-[#101017]/95 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${className}`}>
      {children}
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[#6b7280]">
      {children}
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <div className="font-sans text-xs text-[#6b7280]">{label}</div>
      <div className="mt-1 font-sans text-base tabular-nums text-[#e8e6e3]">{value}</div>
      {hint && <div className="mt-0.5 font-sans text-[11px] text-[#555963]">{hint}</div>}
    </div>
  )
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "quiet"
  className?: string
}) {
  const base =
    "rounded-sm px-4 py-2.5 font-serif text-[11px] font-semibold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B87333]"
  const styles =
    variant === "primary"
      ? "bg-[#B87333] text-[#09090b] shadow-[0_8px_24px_rgba(184,115,51,0.2)] hover:bg-[#c98442] active:scale-[0.99]"
      : "border border-[#B87333]/45 bg-transparent text-[#cfcdc8] hover:border-[#B87333] hover:bg-[#B87333]/10 hover:text-[#f0c08a]"
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}

function AmountInput({
  value,
  onChange,
  max,
  symbol,
  label,
}: {
  value: string
  onChange: (v: string) => void
  max?: bigint
  symbol: string
  label: string
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-sans text-xs text-[#777b85]">{label}</span>
        {max !== undefined && (
          <button
            type="button"
            onClick={() => onChange(formatUnits(max, 18))}
            className="font-sans text-[11px] text-[#B87333] transition-colors hover:text-[#d39150]"
          >
            MAX
          </button>
        )}
      </div>
      <div className="flex items-center rounded-lg border border-[#292933] bg-[#09090c] px-4 transition-colors focus-within:border-[#B87333]/70">
        <input
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="w-full bg-transparent py-3 font-sans text-lg text-[#e8e6e3] outline-none tabular-nums placeholder:text-[#353741]"
        />
        <span className="ml-3 font-sans text-xs text-[#777b85]">{symbol}</span>
      </div>
    </label>
  )
}

function fmt(v: bigint | undefined, dp = 2, decimals = 18): string {
  if (v === undefined) return "—"
  const n = Number(formatUnits(v, decimals))
  if (n === 0) return "0"
  // Small amounts show significant digits rather than flooring to "<0.01".
  if (n < 0.01) return n.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  return n.toLocaleString(undefined, { maximumFractionDigits: dp })
}

function shortAddress(value: `0x${string}`): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function toWei(v: string): bigint {
  try {
    return v.trim() === "" ? 0n : parseUnits(v.trim(), 18)
  } catch {
    return 0n
  }
}

function useLastCompound(vault: `0x${string}`, refreshKey = 0) {
  const client = usePublicClient()
  const [ts, setTs] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!client) return

    const run = async () => {
      try {
        const latest = await client.getBlockNumber()
        const LOOKBACK = 60_000n
        const fromBlock = latest > LOOKBACK ? latest - LOOKBACK : 0n
        const logs = await client.getLogs({ address: vault, event: COMPOUNDED_EVENT, fromBlock, toBlock: latest })
        if (cancelled || logs.length === 0) {
          if (!cancelled) setTs(null)
          return
        }
        const last = logs[logs.length - 1]
        const block = await client.getBlock({ blockNumber: last.blockNumber })
        if (!cancelled) setTs(Number(block.timestamp))
      } catch {
        if (!cancelled) setTs(null)
      }
    }

    run()
    const id = setInterval(run, 120_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [client, vault, refreshKey])

  return ts
}

async function fetchPairPriceUsd(pairAddress: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${pairAddress}`)
    const data = await res.json()
    const price = data?.pair?.priceUsd
    return price ? Number(price) : null
  } catch {
    return null
  }
}

type PriceItem = { key: string; token?: `0x${string}`; pairOverride?: string }

async function fetchTokenPriceUsd(token?: `0x${string}`): Promise<number | null> {
  if (!token) return null
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`)
    const data = await res.json()
    const t = token.toLowerCase()

    const candidates: { price: number; liq: number }[] = []
    for (const p of data.pairs ?? []) {
      const liq = Number(p.liquidity?.usd) || 0
      const base = p.baseToken?.address?.toLowerCase()
      const quote = p.quoteToken?.address?.toLowerCase()
      if (base === t && p.priceUsd) {
        candidates.push({ price: Number(p.priceUsd), liq })
      } else if (quote === t && p.priceUsd && p.priceNative) {
        // priceNative is the base token's price in this token, so this token's USD price is priceUsd / priceNative.
        candidates.push({ price: Number(p.priceUsd) / Number(p.priceNative), liq })
      }
    }
    if (!candidates.length) return null
    return candidates.reduce((a, b) => (b.liq > a.liq ? b : a)).price
  } catch {
    return null
  }
}

function usePriceMap(items: PriceItem[]) {
  const [state, setState] = useState<{ prices: Record<string, number>; loaded: boolean }>({
    prices: {},
    loaded: false,
  })
  const sig = items.map((i) => `${i.key}:${i.token ?? ""}:${i.pairOverride ?? ""}`).join("|")

  useEffect(() => {
    let cancelled = false
    if (items.some((i) => !i.token && !i.pairOverride)) return

    const run = async () => {
      const entries = await Promise.all(
        items.map(async (i) => {
          const price = i.pairOverride
            ? await fetchPairPriceUsd(i.pairOverride)
            : await fetchTokenPriceUsd(i.token)
          return [i.key, price] as const
        }),
      )
      if (cancelled) return
      const prices: Record<string, number> = {}
      for (const [k, p] of entries) if (p) prices[k] = p
      setState({ prices, loaded: true })
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  return state
}

function usdFmt(n: number): string {
  return `$${Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

const WHOLE_TOKENS = new Set(["OPUS", "CODA", "PLS", "PLSX", "PRVX", "HEX", "EHEX", "PTGC", "UFO"])

// Whole-number display for the listed tokens, otherwise the given decimals.
function dpFor(symbol: string, fallback: number): number {
  return WHOLE_TOKENS.has(symbol.toUpperCase()) ? 0 : fallback
}

function usdOf(amount: bigint, decimals: number, price?: number): string | null {
  if (!price) return null
  return usdFmt(Number(formatUnits(amount, decimals)) * price)
}

function Amt({ text, usd }: { text: string; usd: string | null }) {
  return (
    <>
      {text}
      {usd && <span> ({usd})</span>}
    </>
  )
}

function useTargetPriceUsd(tokenAddress: `0x${string}` | undefined, pairOverride?: string) {
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setPrice(null)
    const run = async () => {
      const p = pairOverride
        ? await fetchPairPriceUsd(pairOverride)
        : await fetchTokenPriceUsd(tokenAddress)
      if (!cancelled) setPrice(p)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [tokenAddress, pairOverride])

  return price
}

function useLifetimeEarned(
  vault: `0x${string}`,
  deployBlockInput: bigint | number | string,
  account?: `0x${string}`,
  refreshKey = 0,
) {
  const deployBlock = BigInt(deployBlockInput)
  const client = usePublicClient()
  const [totals, setTotals] = useState<{ compounded: bigint; claimed: bigint } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!client || !account) {
      setTotals(null)
      return
    }
    if (deployBlock === 0n) {
      setError("deployBlock not set in lib/yield.ts")
      return
    }

    const run = async () => {
      try {
        const latest = await client.getBlockNumber()
        const CHUNK = 9_000n
        let compounded = 0n
        let claimed = 0n

        for (let from = deployBlock; from <= latest; from += CHUNK) {
          const to = from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n
          const [settled, claims] = await Promise.all([
            client.getLogs({ address: vault, event: SETTLED_EVENT, args: { user: account }, fromBlock: from, toBlock: to }),
            client.getLogs({ address: vault, event: CLAIMED_EVENT, args: { user: account }, fromBlock: from, toBlock: to }),
          ])
          for (const log of settled) compounded += log.args.compounded ?? 0n
          for (const log of claims) claimed += log.args.amount ?? 0n
          if (cancelled) return
        }

        if (!cancelled) {
          setTotals({ compounded, claimed })
          setError(null)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message.split("\n")[0] : String(e)
        console.error("[yield] lifetime scan failed:", e)
        if (!cancelled) {
          setTotals(null)
          setError(msg.slice(0, 120))
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [client, vault, deployBlock, account, refreshKey])

  return { totals, error }
}

type ClaimedState = {
  status: "idle" | "loading" | "ready"
  data: Record<string, bigint>
}

// Scans CLAIMED logs for all vaults in parallel. Only runs while `enabled`
// (the summary panel is open). Cached per wallet until refreshKey changes.
function useClaimedPerVault(
  vaults: { key: VaultKey; vault: `0x${string}`; deployBlock: bigint }[],
  account: `0x${string}` | undefined,
  enabled: boolean,
  refreshKey = 0,
): ClaimedState {
  const client = usePublicClient()
  const cache = useRef(new Map<string, Record<string, bigint>>())
  const [state, setState] = useState<ClaimedState>({ status: "idle", data: {} })

  useEffect(() => {
    let cancelled = false
    if (!client || !account || !enabled || vaults.length === 0) {
      setState({ status: "idle", data: {} })
      return
    }

    const cacheKey = `${account.toLowerCase()}-${refreshKey}-${vaults.map((v) => v.key).join(",")}`
    const cached = cache.current.get(cacheKey)
    if (cached) {
      setState({ status: "ready", data: cached })
      return
    }

    setState({ status: "loading", data: {} })

    const run = async () => {
      try {
        const latest = await client.getBlockNumber()
        const results = await Promise.all(
          vaults.map(async (v) => {
            let claimed = 0n
            try {
              for (let from = v.deployBlock; from <= latest; from += 9_000n) {
                const to = from + 8_999n > latest ? latest : from + 8_999n
                const logs = await client.getLogs({
                  address: v.vault,
                  event: CLAIMED_EVENT,
                  args: { user: account },
                  fromBlock: from,
                  toBlock: to,
                })
                for (const log of logs) claimed += log.args.amount ?? 0n
              }
            } catch {
              // a failed vault shows 0 rather than blocking the whole table
            }
            return [v.key, claimed] as const
          }),
        )
        if (cancelled) return
        const data = Object.fromEntries(results) as Record<string, bigint>
        cache.current.set(cacheKey, data)
        setState({ status: "ready", data })
      } catch {
        if (!cancelled) setState({ status: "ready", data: {} })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [client, account, enabled, vaults, refreshKey])

  return state
}

export default function AutoCompoundPage() {
  const [principal, setPrincipal] = useState<PrincipalKey>("OPUS")
  const [targetIdx, setTargetIdx] = useState(0)

  const options = vaultsForPrincipal(principal)
  const active = options[targetIdx] ?? options[0]
  const cfg = VAULTS[active]
  const { data: targetTokenAddr } = useReadContract({
    address: cfg.vault,
    abi: VAULT_ABI,
    functionName: "targetToken",
  })
  const targetPriceUsd = useTargetPriceUsd(
    targetTokenAddr as `0x${string}` | undefined,
    (cfg as any).priceOverridePair,
  )

  const { address, isConnected } = useAccount()
  const [viewInput, setViewInput] = useState("")
  const viewAddress = isAddress(viewInput) ? (viewInput as `0x${string}`) : undefined
  const displayAddress = viewAddress ?? address
  const isViewingOther = !!viewAddress && (!address || viewAddress.toLowerCase() !== address.toLowerCase())

  const [depositAmt, setDepositAmt] = useState("")
  const [withdrawAmt, setWithdrawAmt] = useState("")
  const [pctDraft, setPctDraft] = useState<number | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  const busy = isPending || isConfirming

  const resetInputs = () => {
    setPctDraft(null)
    setDepositAmt("")
    setWithdrawAmt("")
  }

  const { data: vaultData } = useReadContracts({
    contracts: [
      { address: cfg.vault, abi: VAULT_ABI, functionName: "totalPrincipal" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "smaugCirculating" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "depositorCount" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "totalWeight" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "totalCompoundWeight" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "sweepableRewards" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "unpaidEarnings" },
    ],
    query: { refetchInterval: 30_000 },
  })

  const totalPrincipal = vaultData?.[0]?.result as bigint | undefined
  const circulating = vaultData?.[1]?.result as bigint | undefined
  const depositorCount = vaultData?.[2]?.result as bigint | undefined

  const avgCompoundPct = weightedCompoundPct(
    vaultData?.[4]?.result as bigint | undefined,
    vaultData?.[3]?.result as bigint | undefined,
  )

  const pendingRewards = ((vaultData?.[5]?.result as bigint) ?? 0n) + ((vaultData?.[6]?.result as bigint) ?? 0n)

  const { data: pendingTargetData } = useReadContract({
    address: cfg.vault,
    abi: VAULT_ABI,
    functionName: "pendingTargetConversion",
    query: { enabled: cfg.isConverter, refetchInterval: 30_000 },
  })
  const pendingTargetConversion = pendingTargetData as bigint | undefined

  const exclusions = CIRCULATING_EXCLUSIONS[active]

  const { data: tokenTotalSupply } = useReadContract({
    address: cfg.token,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    query: { refetchInterval: 60_000 },
  })

  const { data: excludedBalances } = useReadContracts({
    contracts: exclusions.map((addr) => ({
      address: cfg.token,
      abi: ERC20_ABI,
      functionName: "balanceOf" as const,
      args: [addr] as const,
    })),
    query: { refetchInterval: 60_000 },
  })

  const shareOfCirculating = vaultShareOfCirculating(
    totalPrincipal,
    tokenTotalSupply as bigint | undefined,
    (excludedBalances ?? []).map((r) => r?.result as bigint | undefined),
  )

  const [historyKey, setHistoryKey] = useState(0)
  const lastCompound = useLastCompound(cfg.vault, historyKey)
  const { totals: lifetime, error: lifetimeError } = useLifetimeEarned(
    cfg.vault,
    cfg.deployBlock,
    displayAddress,
    historyKey,
  )

  const { data: userData, refetch: refetchUser } = useReadContracts({
    contracts: displayAddress
      ? [
          { address: cfg.vault, abi: VAULT_ABI, functionName: "positionOf", args: [displayAddress] },
          { address: cfg.token, abi: ERC20_ABI, functionName: "balanceOf", args: [displayAddress] },
          { address: cfg.token, abi: ERC20_ABI, functionName: "allowance", args: [displayAddress, cfg.vault] },
        ]
      : [],
    query: { enabled: !!displayAddress, refetchInterval: 15_000 },
  })

  const allVaults = useMemo(() => vaultsForPrincipal(principal), [principal])

  const { data: aggregateData } = useReadContracts({
    contracts: displayAddress
      ? allVaults.map((k) => ({
          address: VAULTS[k].vault,
          abi: VAULT_ABI,
          functionName: "positionOf" as const,
          args: [displayAddress] as const,
        }))
      : [],
    query: { enabled: !!displayAddress, refetchInterval: 30_000 },
  })

  const aggregate = useMemo(() => {
    let total = 0n
    let count = 0
    aggregateData?.forEach((r) => {
      const pos = r.result as Position | undefined
      if (!pos) return
      const bal = pos[0] + pos[4]
      if (bal > 0n) {
        total += bal
        count++
      }
    })
    return { total, count }
  }, [aggregateData])

  const vaultSummary = useMemo(() => {
    const rows: { key: VaultKey; balance: bigint; claimable: bigint }[] = []
    aggregateData?.forEach((r, i) => {
      const pos = r.result as Position | undefined
      if (!pos) return
      const balance = pos[0] + pos[4]
      const claimable = pos[5]
      if (balance === 0n && claimable === 0n) return
      rows.push({ key: allVaults[i], balance, claimable })
    })
    return rows
  }, [aggregateData, allVaults])

  const vaultMeta = useMemo(
    () =>
      allVaults.map((k) => ({
        key: k,
        vault: VAULTS[k].vault,
        deployBlock: BigInt(VAULTS[k].deployBlock),
      })),
    [allVaults],
  )

  const { data: targetAddrData } = useReadContracts({
    contracts: allVaults.map((k) => ({
      address: VAULTS[k].vault,
      abi: VAULT_ABI,
      functionName: "targetToken" as const,
    })),
    query: { refetchInterval: 300_000 },
  })
  const priceItems: PriceItem[] = useMemo(
    () => [
      { key: "principal", token: VAULTS[allVaults[0]].token as `0x${string}` },
      ...allVaults.map((k, i) => ({
        key: k,
        token: targetAddrData?.[i]?.result as `0x${string}` | undefined,
        pairOverride: (VAULTS[k] as any).priceOverridePair as string | undefined,
      })),
    ],
    [allVaults, targetAddrData],
  )
  const { prices, loaded: pricesLoaded } = usePriceMap(priceItems)

  const claimed = useClaimedPerVault(vaultMeta, displayAddress, summaryOpen, historyKey)
  const summaryTotals = useMemo(() => {
    let claimableUsd = 0
    let claimedUsd = 0
    let balanceUsd = 0
    for (const v of vaultSummary) {
      const dec = VAULTS[v.key].targetDecimals
      const tp = prices[v.key]
      if (tp) {
        claimableUsd += Number(formatUnits(v.claimable, dec)) * tp
        claimedUsd += Number(formatUnits(claimed.data[v.key] ?? 0n, dec)) * tp
      }
      if (prices.principal) balanceUsd += Number(formatUnits(v.balance, 18)) * prices.principal
    }
    return { claimableUsd, claimedUsd, balanceUsd }
  }, [vaultSummary, prices, claimed.data])
  const aggregateUsd = usdOf(aggregate.total, 18, prices.principal)

  useEffect(() => {
    if (!isConfirmed) return
    refetchUser()
    setHistoryKey((k) => k + 1)
  }, [isConfirmed, refetchUser])

  const position = userData?.[0]?.result as Position | undefined

  const [principalAmt, smaugInWallet, tier, , pendingIn, claimable, compoundPct] =
    position ?? [0n, 0n, 100n, 0n, 0n, 0n, 100]

  const walletToken = (userData?.[1]?.result as bigint) ?? 0n
  const allowance = (userData?.[2]?.result as bigint) ?? 0n

  const depositWei = toWei(depositAmt)
  const needsApproval = depositWei > 0n && allowance < depositWei

  const isNewDepositor = Number(compoundPct) === 0
  const storedPct = isNewDepositor ? cfg.defaultCompoundPct : Number(compoundPct)

  const pct = pctDraft ?? storedPct
  const pctChanged = pctDraft !== null && pctDraft !== storedPct
  const rateNeedsTx = isNewDepositor && pctChanged

  const nextTier = useMemo(() => {
    if (!circulating) return null
    return smaugForNextTier(Number(tier), circulating)
  }, [tier, circulating])

  const tierProgressPct = useMemo(() => {
    if (!nextTier) return 100
    const target = Number(nextTier.smaug)
    if (target === 0) return 100
    return Math.min(100, (Number(smaugInWallet) / target) * 100)
  }, [nextTier, smaugInWallet])

  const readableError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e)
    if (/User rejected|denied transaction/i.test(msg)) return null
    const named = msg.match(/reverted with the following reason:\s*(.+)/i)
    if (named) return named[1].split("\n")[0].trim()
    const custom = msg.match(/Error:\s*([A-Za-z]+)\(\)/)
    if (custom) return custom[1]
    return msg.split("\n")[0].slice(0, 160)
  }

  const send = (fn: string, args: readonly unknown[] = []) => {
    setTxError(null)
    writeContract(
      { address: cfg.vault, abi: VAULT_ABI, functionName: fn as never, args: args as never },
      { onError: (e) => setTxError(readableError(e)) },
    )
  }

  const balance = principalAmt + pendingIn
  const shareOfVault =
    totalPrincipal !== undefined && totalPrincipal > 0n && balance > 0n
      ? Number((balance * 1_000_000n) / totalPrincipal) / 10_000
      : null

  const compoundedTotal = lifetime ? lifetime.compounded + pendingIn : undefined

  // ── Public trigger via KeeperRelay ───────────────────────────────
  // status() folds in paused / disabled / over-cap, so the two flags are
  // all the buttons need. The floor is computed here from a quote read a
  // moment ago; the relay only checks it is not absurdly low.
  const { data: relayStatus, refetch: refetchRelay } = useReadContract({
    address: RELAY_ADDRESS,
    abi: RELAY_ABI,
    functionName: "status",
    args: [cfg.vault],
    query: { enabled: !NO_RELAY, refetchInterval: 30_000 },
  })
  useEffect(() => {
    if (!isConfirmed || NO_RELAY) return
    refetchRelay()
  }, [isConfirmed, refetchRelay])

  const [relayEnabled, compoundAvailable, convertAvailable, , rCompoundOut, , rConvertOut] =
    (relayStatus as
      | readonly [boolean, boolean, boolean, bigint, bigint, bigint, bigint, bigint, bigint]
      | undefined) ?? [false, false, false, 0n, 0n, 0n, 0n, 0n, 0n]

  const targetTax: number = (cfg as any).targetTax ?? 0

  const poke = (fn: "pokeCompound" | "pokeConvert", minOut: bigint) => {
    setTxError(null)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS)
    writeContract(
      { address: RELAY_ADDRESS, abi: RELAY_ABI, functionName: fn, args: [cfg.vault, minOut, deadline] },
      { onError: (e) => setTxError(readableError(e)) },
    )
  }

  const doCompound = () => {
    if (!compoundAvailable) return
    const factor = BigInt(Math.round((1 - BUY_TAX) * (1 - SLIPPAGE) * 10000))
    poke("pokeCompound", (rCompoundOut * factor) / 10000n)
  }

  const doConvert = () => {
    if (!convertAvailable) return
    const factor = BigInt(Math.round((1 - targetTax) * (1 - SLIPPAGE) * 10000))
    poke("pokeConvert", (rConvertOut * factor) / 10000n)
  }

  return (
    <>
      <SiteNav />

      <main className="relative isolate mx-auto min-h-[calc(100vh-4rem)] max-w-5xl overflow-hidden bg-transparent px-4 pb-16 pt-8 md:px-6 md:pt-10 [&>header]:relative [&>header]:z-10 [&>section]:relative [&>section]:z-10 [&>div:not(.yield-background)]:relative [&>div:not(.yield-background)]:z-10">
        <div
          aria-hidden="true"
          className="yield-background pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <img
            src="/landing/hoard.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.28] mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1b211d]/10 via-[#1b211d]/55 to-[#1b211d]/95" />
        </div>

        <header className="mb-6">
          <h1 className="font-serif text-3xl font-bold tracking-[-0.02em] text-[#e8e6e3] md:text-4xl">
            Compound some. Yield the rest.
          </h1>
          <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-[#777b85]">
            Deposit Opus or Coda, choose your split between compounding and yield, and the vault takes care of the rest.
          </p>
        </header>

        {aggregate.count > 0 && (
  <p className="mb-3 font-sans text-sm text-[#a8abb2]">
    You have {fmt(aggregate.total)} {principal}
    {aggregateUsd && <span> ({aggregateUsd})</span>} across {aggregate.count} Vault{aggregate.count === 1 ? "" : "s"}
  </p>
        )}

        {/* Principal + reward selector — kept on one visual row to save vertical space */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="mr-1 hidden font-serif text-xs text-[#b87333]/70 sm:inline">◆</span>
          <div className="inline-flex w-fit rounded-sm border border-[#8f6237]/55 bg-[#111713]/90 p-1 shadow-[inset_0_0_0_1px_rgba(184,115,51,0.08),0_8px_24px_rgba(0,0,0,0.18)]">
            {PRINCIPALS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPrincipal(p)
                  setTargetIdx(0)
                  resetInputs()
                }}
                className={`min-w-[92px] rounded-sm px-5 py-2 font-serif text-sm font-semibold tracking-[0.08em] transition-all ${principal === p ? "bg-[#c4813c] text-[#17110b] shadow-[0_4px_18px_rgba(184,115,51,0.28)]" : "text-[#a8a99f] hover:bg-[#263027] hover:text-[#f0e7d8]"}`}
              >
                {p}
              </button>
            ))}
          </div>

          {options.length > 1 && (
            <>
              {/* Desktop: horizontal scroll row */}
              <div className="hidden min-w-0 flex-1 items-start gap-2 sm:flex">
                <span className="shrink-0 pt-2 font-serif text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a99a82]">Rewards:</span>
                <div className="flex flex-wrap gap-1">
                  {options.map((k, i) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setTargetIdx(i)
                        resetInputs()
                      }}
                      className={`shrink-0 rounded-sm px-3 py-1.5 font-serif text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${targetIdx === i ? "bg-[#b87333]/20 text-[#f0c08a] shadow-[inset_0_0_0_1px_rgba(184,115,51,0.45)]" : "text-[#b0aa9d] hover:bg-[#263027] hover:text-[#f0e7d8]"}`}
                    >
                      {VAULTS[k].targetSymbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile: wraps below, everything visible, no scrolling needed */}
              <div className="w-full sm:hidden">
                <span className="mb-1.5 block font-serif text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a99a82]">Rewards</span>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((k, i) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setTargetIdx(i)
                        resetInputs()
                      }}
                      className={`rounded-sm px-3 py-1.5 font-serif text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${targetIdx === i ? "bg-[#b87333]/20 text-[#f0c08a] shadow-[inset_0_0_0_1px_rgba(184,115,51,0.45)]" : "text-[#b0aa9d] hover:bg-[#263027] hover:text-[#f0e7d8]"}`}
                    >
                      {VAULTS[k].targetSymbol}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="0x… (view any address)"
            value={viewInput}
            onChange={(e) => setViewInput(e.target.value.trim())}
            aria-label="View another wallet address"
            className="w-full max-w-sm rounded-lg border border-[#292933] bg-[#09090c] px-3 py-2 font-mono text-xs text-[#e8e6e3] outline-none focus:border-[#B87333]/70"
          />
          {viewInput && !isAddress(viewInput) && (
            <span className="font-sans text-[11px] text-[#B87333]">Not a valid address</span>
          )}
          {isViewingOther && viewAddress && (
            <span className="rounded-full border border-[#B87333]/40 px-2.5 py-1 font-sans text-[10px] uppercase tracking-wider text-[#B87333]">
              Viewing {shortAddress(viewAddress)} — read only
            </span>
          )}
        </div>

<details
  className="relative z-10 mb-6 rounded-2xl border border-[#2a2a35] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
  style={{ backgroundColor: "#101017" }}
  onToggle={(e) => setSummaryOpen((e.target as HTMLDetailsElement).open)}
>
  <summary className="cursor-pointer font-sans text-sm font-medium text-[#ffffff]">
    Vault summary
  </summary>
  <div className="mt-4 overflow-x-auto">
    {!displayAddress ? (
      <p className="font-sans text-sm text-[#ffffff]">
        Connect a wallet or enter an address to see the summary.
      </p>
    ) : aggregateData === undefined ? (
      <p className="font-sans text-sm text-[#ffffff]">Loading your vault data…</p>
    ) : (
      <>
        <div className="grid min-w-[560px] grid-cols-[1.2fr_1fr_1fr_1fr] items-center gap-x-6 gap-y-3 font-sans text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffffff]">Vault</div>
          <div className="text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffffff]">Claimable</div>
          <div className="text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffffff]">Claimed</div>
          <div className="text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffffff]">Deposited in vault</div>

                    {vaultSummary.map((v) => {
            const dec = VAULTS[v.key].targetDecimals
            const sym = VAULTS[v.key].targetSymbol
            const claimedAmt = claimed.data[v.key] ?? 0n
            return (
              <div key={v.key} className="contents">
                <div className="font-medium text-[#ffffff]">{sym}</div>
                <div className="text-right tabular-nums text-[#ffffff]">
                  <Amt
                    text={`${fmt(v.claimable, dpFor(sym, 4), dec)} ${sym}`}
                    usd={usdOf(v.claimable, dec, prices[v.key])}
                  />
                </div>
                <div className="text-right tabular-nums text-[#ffffff]">
                  {claimed.status === "ready" ? (
                    <Amt
                      text={`${fmt(claimedAmt, dpFor(sym, 4), dec)} ${sym}`}
                      usd={usdOf(claimedAmt, dec, prices[v.key])}
                    />
                  ) : (
                    "…"
                  )}
                </div>
                <div className="text-right tabular-nums text-[#ffffff]">
                  <Amt
                    text={`${fmt(v.balance, dpFor(principal, 2))} ${principal}`}
                    usd={usdOf(v.balance, 18, prices.principal)}
                  />
                </div>
              </div>
            )
          })}

          <div className="border-t border-[#3a3a46] pt-3 font-semibold text-[#ffffff]">Total</div>
          <div className="border-t border-[#3a3a46] pt-3 text-right font-semibold tabular-nums text-[#ffffff]">
            {pricesLoaded ? usdFmt(summaryTotals.claimableUsd) : "…"}
          </div>
          <div className="border-t border-[#3a3a46] pt-3 text-right font-semibold tabular-nums text-[#ffffff]">
            {pricesLoaded && claimed.status === "ready" ? usdFmt(summaryTotals.claimedUsd) : "…"}
          </div>
          <div className="border-t border-[#3a3a46] pt-3 text-right font-semibold tabular-nums text-[#ffffff]">
            {pricesLoaded ? usdFmt(summaryTotals.balanceUsd) : "…"}
          </div>
        </div>
        {vaultSummary.length === 0 && (
          <p className="mt-3 font-sans text-sm text-[#ffffff]">No positions in this token.</p>
        )}
                {(claimed.status !== "ready" || !pricesLoaded) && (
          <p className="mt-3 font-sans text-sm text-[#ffffff]">
            Please wait, still loading{" "}
            {claimed.status !== "ready" && !pricesLoaded
              ? "claimed amounts and USD values"
              : claimed.status !== "ready"
                ? "claimed amounts"
                : "USD values"}
            …
          </p>
        )}
      </>
    )}
  </div>
</details>   

        <Panel className="mb-4 p-5 md:p-6">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <Stat
              label={`${cfg.rewardSymbol} awaiting compound`}
              value={fmt(pendingRewards, 0)}
              hint="Held plus owed by the distributor"
            />
            <Stat
              label="Last compounded"
              value={lastCompound ? timeAgo(lastCompound) : "—"}
              hint={lastCompound ? undefined : "No compound in the last week"}
            />
            {cfg.isConverter && (
              <Stat
                label={`Awaiting ${cfg.targetSymbol}`}
                value={fmt(pendingTargetConversion, 2)}
                hint={`${cfg.rewardSymbol} already split off for yield`}
              />
            )}
          </div>

          {isConnected && relayEnabled && (
            <div className="mt-5 border-t border-[#202029] pt-4">
              <SectionLabel>Run the vault yourself</SectionLabel>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="quiet" onClick={doCompound} disabled={busy || !compoundAvailable}>
                  Compound
                </Button>
                {cfg.isConverter && (
                  <Button variant="quiet" onClick={doConvert} disabled={busy || !convertAvailable}>
                    Distribute
                  </Button>
                )}
              </div>
              <p className="mt-2 font-sans text-[11px] text-[#555963]">
                Anyone can run this manually if they wish. Compound reinvests rewards into the vault; Distribute makes the
                yield share claimable. If it is greyed out there is nothing yet to run.
              </p>
            </div>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#25252e] px-5 py-4 md:px-7">
            <div>
              <SectionLabel>{cfg.tokenSymbol} vault</SectionLabel>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-sans text-2xl tracking-tight text-[#e8e6e3] tabular-nums md:text-3xl">
                  {fmt(balance)}
                </span>
                <span className="font-sans text-xs text-[#626672]">{cfg.tokenSymbol}</span>
              </div>
              <div className="mt-1 font-sans text-xs text-[#626672]">
                {shareOfVault !== null ? `${shareOfVault.toFixed(2)}% of vault` : "Your vault position"}
              </div>
            </div>

            <div className="text-right">
              <SectionLabel>Earned by compounding</SectionLabel>
              <div className="mt-1.5 font-sans text-lg text-[#B87333] tabular-nums">
                {compoundedTotal !== undefined ? `+${fmt(compoundedTotal)}` : "—"}{" "}
                <span className="text-xs text-[#626672]">{cfg.tokenSymbol}</span>
              </div>
            </div>
          </div>

          {/* Reinvestment slider — compacted: single-line labels instead of stacked rows */}
          <div className="px-5 py-5 md:px-7">
            <div className="flex items-center justify-between">
              <SectionLabel>Reinvestment</SectionLabel>
              <span className="font-sans text-lg text-[#B87333] tabular-nums">{pct}%</span>
            </div>

            <input
              type="range"
              min={cfg.minCompoundPct}
              max={100}
              step={1}
              value={pct}
              onChange={(e) => setPctDraft(Number(e.target.value))}
              aria-label="Reinvestment rate"
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-[#B87333]"
              style={{
                background: `linear-gradient(to right, ${COPPER} 0%, ${COPPER} ${pct}%, ${BORDER} ${pct}%, ${BORDER} 100%)`,
              }}
            />

            <div className="mt-2 flex items-center justify-between font-sans text-[11px] text-[#555963]">
              <span>{pct}% → {cfg.tokenSymbol}</span>
              <span>{100 - pct}% → {cfg.targetSymbol}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[0, 25, 50, 75, 100]
                .filter((p) => p >= cfg.minCompoundPct)
                .map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPctDraft(p)}
                    className={`rounded-md border px-3 py-1.5 font-sans text-[11px] transition-colors ${pct === p
                      ? "border-[#B87333]/70 bg-[#B87333]/15 text-[#f0c08a] shadow-[0_4px_14px_rgba(184,115,51,0.14)]"
                      : "border-[#3a443d] text-[#8d918b] hover:border-[#B87333]/70 hover:bg-[#1b211d] hover:text-[#e8e6e3]"}`}
                  >
                    {p}%{p === cfg.defaultCompoundPct && <span className="ml-1 text-[#4f535d]">default</span>}
                  </button>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => send("setCompoundPct", [pct])} disabled={busy || !pctChanged}>
                {pctChanged ? "Save rate" : "Rate saved"}
              </Button>
              <span className="font-sans text-[11px] text-[#555963]">
                {pctChanged ? (
                  <>
                    Currently <span className="text-[#a8abb2] tabular-nums">{storedPct}%</span> on-chain
                    {" → "}
                    <span className="text-[#B87333] tabular-nums">{pct}%</span>
                  </>
                ) : isNewDepositor ? (
                  <>
                    Default <span className="text-[#a8abb2] tabular-nums">{storedPct}%</span> until you set one
                  </>
                ) : (
                  <>
                    Currently <span className="text-[#a8abb2] tabular-nums">{storedPct}%</span>
                  </>
                )}
              </span>
              {rateNeedsTx && (
                <p className="font-sans text-[11px] leading-5 text-[#B87333]">
                  If you want another rate than the default, save your preferred rate by submitting it to the blockchain.
                </p>
              )}
            </div>
          </div>
        </Panel>

        {isConnected ? (
          <>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Panel className="p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <SectionLabel>Your rewards</SectionLabel>
                  <span className="rounded-full border border-[#25252e] px-2.5 py-0.5 font-sans text-[10px] uppercase tracking-wider text-[#555963]">
                    Available
                  </span>
                </div>

                <div className="mt-3 font-sans text-2xl text-[#e8e6e3] tabular-nums">
                  {fmt(claimable, 2, cfg.targetDecimals)}
                  {targetPriceUsd !== null && claimable > 0n && (
                    <span className="ml-2 font-sans text-sm font-normal text-[#626672]">
                      (${(
                        Number(formatUnits(claimable, cfg.targetDecimals)) * targetPriceUsd
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                    </span>
                  )}
                </div>
                <div className="mt-0.5 font-sans text-xs text-[#626672]">{cfg.targetSymbol} ready to claim</div>

                <div className="mt-4 flex items-center justify-between border-t border-[#202029] pt-3">
                  <span className="font-sans text-xs text-[#6b7280]">Claimed so far</span>
                  <span className="font-sans text-sm tabular-nums text-[#e8e6e3]">
                    {lifetime ? fmt(lifetime.claimed, 2, cfg.targetDecimals) : "—"} {cfg.targetSymbol}
                  </span>
                </div>

                <Button className="mt-4 w-full" onClick={() => send("claim")} disabled={busy || isViewingOther || claimable === 0n}>
                  Claim {cfg.targetSymbol}
                </Button>

                {lifetimeError && (
                  <p className="mt-2 font-sans text-[11px] text-[#6b7280]">History unavailable: {lifetimeError}</p>
                )}
              </Panel>

              <Panel className="p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <SectionLabel>Your Smaug tier</SectionLabel>
                  <span className="font-sans text-xs text-[#626672]">{fmt(smaugInWallet, 0)} SMAUG</span>
                </div>

                <div className="mt-3 font-sans text-2xl text-[#B87333]">{formatTier(tier)}</div>

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#25252e]">
                  <div
                    className="h-full rounded-full bg-[#B87333] transition-all"
                    style={{ width: `${tierProgressPct}%` }}
                  />
                </div>

                <p className="mt-2 font-sans text-[11px] leading-5 text-[#555963]">
                  {nextTier
                    ? `Hold ${fmt(nextTier.smaug, 0)} Smaug to reach ${formatTier(nextTier.tier)}.`
                    : "You're at the highest tier."}
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <Button variant="quiet" onClick={() => send("refreshWeight", [address])} disabled={busy || isViewingOther}>
                    Refresh tier
                  </Button>
                  <span className="font-sans text-[11px] text-[#4e525c]">Updates automatically over time</span>
                </div>
              </Panel>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Panel className="p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <SectionLabel>Deposit {cfg.tokenSymbol}</SectionLabel>
                  <span className="font-sans text-[11px] text-[#555963]">{fmt(walletToken)} in wallet</span>
                </div>

                <AmountInput
                  label="Amount"
                  value={depositAmt}
                  onChange={setDepositAmt}
                  max={walletToken}
                  symbol={cfg.tokenSymbol}
                />

                <div className="mt-3 flex items-center justify-between rounded-lg border border-[#202029] bg-[#09090c] px-4 py-2.5">
                  <span className="font-sans text-xs text-[#626672]">Reinvestment rate</span>
                  <span className="font-sans text-sm text-[#B87333] tabular-nums">{pct}%</span>
                </div>

                {rateNeedsTx && (
                  <p className="mt-2 font-sans text-[11px] leading-5 text-[#B87333]">
                    Save the rate first — it requires its own transaction before your first deposit.
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  {needsApproval && (
                    <Button
                      onClick={() => {
                        setTxError(null)
                        writeContract(
                          { address: cfg.token, abi: ERC20_ABI, functionName: "approve", args: [cfg.vault, maxUint256] },
                          { onError: (e) => setTxError(readableError(e)) },
                        )
                      }}
                      disabled={busy || isViewingOther}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      send("deposit", [depositWei])
                      setDepositAmt("")
                    }}
                    disabled={busy || isViewingOther || needsApproval || rateNeedsTx || depositWei === 0n}
                    className="flex-1"
                  >
                    Deposit
                  </Button>
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <SectionLabel>Withdraw</SectionLabel>
                  <span className="font-sans text-[11px] text-[#555963]">
                    {fmt(balance)} {cfg.tokenSymbol}
                  </span>
                </div>

                <AmountInput
                  label="Amount"
                  value={withdrawAmt}
                  onChange={setWithdrawAmt}
                  max={principalAmt}
                  symbol={cfg.tokenSymbol}
                />

                <p className="mt-3 font-sans text-[11px] leading-5 text-[#555963]">
                  No lock-up, no exit fee. Claimable {cfg.targetSymbol} stays separate.
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      send("withdraw", [toWei(withdrawAmt)])
                      setWithdrawAmt("")
                    }}
                    disabled={busy || isViewingOther || toWei(withdrawAmt) === 0n}
                    className="flex-1"
                  >
                    Withdraw
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => send("withdrawAll")}
                    disabled={busy || (principalAmt === 0n && claimable === 0n)}
                    className="flex-1"
                  >
                    Withdraw all
                  </Button>
                </div>
              </Panel>
            </div>
          </>
        ) : (
          <Panel className="mt-4 overflow-hidden">
            <div className="px-6 py-8 text-center md:px-10 md:py-10">
              <SectionLabel>Get started</SectionLabel>
              <h2 className="mt-2 font-serif text-2xl text-[#e8e6e3]">Connect your wallet</h2>
              <p className="mx-auto mt-2 max-w-md font-sans text-sm leading-6 text-[#6b7280]">
                Deposit {cfg.tokenSymbol}, set your reinvestment rate, and let the vault compound your rewards.
              </p>
              <div className="mt-5 flex justify-center">
                <ConnectWalletButton />
              </div>
            </div>
          </Panel>
        )}

        <div className="mt-6 border-t border-[#1d1d25] pt-5">
          <div className="grid grid-cols-2 gap-y-5 md:grid-cols-3 md:gap-5">
            <Stat
              label={`Total ${cfg.tokenSymbol} deposited`}
              value={fmt(totalPrincipal, 0)}
              hint={shareOfCirculating !== null ? `${shareOfCirculating.toFixed(2)}% of circulating` : "All depositors"}
            />
            <Stat label="Depositors" value={depositorCount !== undefined ? depositorCount.toString() : "—"} />
            <Stat
              label="Average reinvestment"
              value={avgCompoundPct !== null ? `${avgCompoundPct.toFixed(0)}%` : "—"}
              hint="Weighted by position size"
            />
          </div>
        </div>

        {busy && (
          <div className="mt-5 flex items-center gap-2 font-sans text-xs text-[#B87333]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B87333]" />
            Waiting for confirmation…
          </div>
        )}

        {txError && !busy && (
          <div className="mt-5 rounded-lg border border-[#5b2525] bg-[#3b1111]/20 px-4 py-3">
            <p className="font-sans text-xs text-[#e99b9b]">{txError}</p>
          </div>
        )}
      </main>
    </>
  )
}
