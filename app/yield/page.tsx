// app/yield/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { formatUnits, parseUnits, maxUint256 } from "viem"
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
  type PrincipalKey,
} from "@/lib/yield"

const COPPER = "#B87333"
const BORDER = "#25252e"

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-[#25252e] bg-[#0d0d12] ${className}`}>
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
    "rounded-lg px-4 py-2.5 font-sans text-sm transition-all disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B87333]"
  const styles =
    variant === "primary"
      ? "bg-[#B87333] text-[#09090b] hover:bg-[#c98442] active:scale-[0.99]"
      : "border border-[#292933] bg-transparent text-[#cfcdc8] hover:border-[#B87333]/60 hover:text-[#B87333]"
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
  // A dollar of pWBTC is a few ten-thousandths of a token — flooring it
  // makes a real, claimable balance look like nothing.
  if (n < 0.01) return n.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  return n.toLocaleString(undefined, { maximumFractionDigits: dp })
}

function toWei(v: string): bigint {
  try {
    return v.trim() === "" ? 0n : parseUnits(v.trim(), 18)
  } catch {
    return 0n
  }
}

function useLastCompound(vault: `0x${string}`) {
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
  }, [client, vault])

  return ts
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

export default function AutoCompoundPage() {
  const [principal, setPrincipal] = useState<PrincipalKey>("OPUS")
  const [targetIdx, setTargetIdx] = useState(0)

  const options = vaultsForPrincipal(principal)
  const active = options[targetIdx] ?? options[0]
  const cfg = VAULTS[active]

  const { address, isConnected } = useAccount()

  const [depositAmt, setDepositAmt] = useState("")
  const [withdrawAmt, setWithdrawAmt] = useState("")
  const [pctDraft, setPctDraft] = useState<number | null>(null)
  const [txError, setTxError] = useState<string | null>(null)

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

  const lastCompound = useLastCompound(cfg.vault)
  const [historyKey, setHistoryKey] = useState(0)
  const { totals: lifetime, error: lifetimeError } = useLifetimeEarned(
    cfg.vault,
    cfg.deployBlock,
    address,
    historyKey,
  )

  const { data: userData, refetch: refetchUser } = useReadContracts({
    contracts: address
      ? [
        { address: cfg.vault, abi: VAULT_ABI, functionName: "positionOf", args: [address] },
        { address: cfg.token, abi: ERC20_ABI, functionName: "balanceOf", args: [address] },
        { address: cfg.token, abi: ERC20_ABI, functionName: "allowance", args: [address, cfg.vault] },
      ]
      : [],
    query: { enabled: !!address, refetchInterval: 15_000 },
  })
  useEffect(() => {
    if (!isConfirmed) return
    refetchUser()
    setHistoryKey((k) => k + 1)
  }, [isConfirmed, refetchUser])

  const position = userData?.[0]?.result as
    | readonly [bigint, bigint, bigint, bigint, bigint, bigint, number]
    | undefined

  const [principalAmt, smaugInWallet, tier, , pendingIn, claimable, compoundPct] =
    position ?? [0n, 0n, 100n, 0n, 0n, 0n, 100]

  const walletToken = (userData?.[1]?.result as bigint) ?? 0n
  const allowance = (userData?.[2]?.result as bigint) ?? 0n

  const depositWei = toWei(depositAmt)
  const needsApproval = depositWei > 0n && allowance < depositWei

  const isNewDepositor = Number(compoundPct) === 0
  // Fixed: fall back to the contract's real default (50%), not a hardcoded 100.
  const storedPct = isNewDepositor ? cfg.defaultCompoundPct : Number(compoundPct)

  const pct = pctDraft ?? storedPct
  const pctChanged = pctDraft !== null && pctDraft !== storedPct
  const rateNeedsTx = isNewDepositor && pctChanged

  const nextTier = useMemo(() => {
    if (!circulating) return null
    return smaugForNextTier(Number(tier), circulating)
  }, [tier, circulating])

  // Fixed: real progress toward the next tier, not a hardcoded 62%.
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

  return (
    <>
      <SiteNav />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:px-6 md:pt-10">
        <header className="mb-6">
          <h1 className="font-serif text-3xl tracking-[-0.02em] text-[#e8e6e3] md:text-4xl">
            Compound some. Yield the rest.
          </h1>
          <p className="mt-2 max-w-xl font-sans text-sm leading-6 text-[#777b85]">
            Deposit {cfg.tokenSymbol}, choose your split between compounding and yield, and the vault takes care of the rest.
          </p>
        </header>

        {/* Principal + reward selector — kept on one visual row to save vertical space */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex w-fit rounded-lg border border-[#25252e] bg-[#0a0a0d] p-1">
            {PRINCIPALS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPrincipal(p)
                  setTargetIdx(0)
                  resetInputs()
                }}
                className={`min-w-[92px] rounded-md px-5 py-2 font-sans text-sm transition-all ${principal === p ? "bg-[#B87333] text-[#09090b]" : "text-[#777b85] hover:text-[#e8e6e3]"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          {options.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-[#4e525c]">Rewards</span>
              <div className="flex gap-1">
                {options.map((k, i) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setTargetIdx(i)
                      resetInputs()
                    }}
                    className={`rounded-md px-3 py-1.5 font-sans text-xs transition-colors ${targetIdx === i ? "bg-[#B87333]/10 text-[#B87333]" : "text-[#626672] hover:text-[#b8bac0]"
                      }`}
                  >
                    {VAULTS[k].targetSymbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
    className={`rounded-md border px-3 py-1.5 font-sans text-[11px] transition-colors ${
      pct === p
        ? "border-[#B87333]/70 bg-[#B87333]/10 text-[#B87333]"
        : "border-[#25252e] text-[#5f636d] hover:border-[#3a3a45] hover:text-[#a8abb2]"
    }`}
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
                  Save the rate before your first deposit — it's a separate transaction.
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
                </div>
                <div className="mt-0.5 font-sans text-xs text-[#626672]">{cfg.targetSymbol} ready to claim</div>

                <div className="mt-4 flex items-center justify-between border-t border-[#202029] pt-3">
                  <span className="font-sans text-xs text-[#6b7280]">Claimed so far</span>
                  <span className="font-sans text-sm tabular-nums text-[#e8e6e3]">
                    {lifetime ? fmt(lifetime.claimed, 2, cfg.targetDecimals) : "—"} {cfg.targetSymbol}
                  </span>
                </div>

                <Button className="mt-4 w-full" onClick={() => send("claim")} disabled={busy || claimable === 0n}>
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
                  <Button variant="quiet" onClick={() => send("refreshWeight", [address])} disabled={busy}>
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
                      disabled={busy}
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
                    disabled={busy || needsApproval || rateNeedsTx || depositWei === 0n}
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
                    disabled={busy || toWei(withdrawAmt) === 0n}
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
           <div className="grid grid-cols-2 gap-y-5 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
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
            <Stat
              label={`${cfg.rewardSymbol} awaiting compound`}
              value={fmt(pendingRewards, 0)}
              hint="Held plus owed by the distributor"
            />
            {cfg.isConverter ? (
              <Stat
                label={`Awaiting ${cfg.targetSymbol}`}
                value={fmt(pendingTargetConversion, 2)}
                hint={`${cfg.rewardSymbol} already split off for yield`}
              />
            ) : (
              <Stat
                label="Last compounded"
                value={lastCompound ? timeAgo(lastCompound) : "—"}
                hint={lastCompound ? undefined : "No compound in the last week"}
              />
            )}
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