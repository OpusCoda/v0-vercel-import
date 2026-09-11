// app/auto-compound/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { formatUnits, parseUnits, maxUint256 } from "viem"
import {
  useAccount,
  usePublicClient,
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
  SMAUG_ADDRESS,
  MIN_COMPOUND_PCT,
  formatTier,
  smaugForNextTier,
  timeAgo,
  COMPOUNDED_EVENT,
  SETTLED_EVENT,
  CLAIMED_EVENT,
  type VaultKey,
} from "@/lib/auto-compounder"

/* ── presentational pieces ───────────────────────────────────────── */

function Panel({
  title,
  children,
  aside,
}: {
  title: string
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-[#2a2a35] bg-[#0e0e13] p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-base text-[#e8e6e3]">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
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
      <div className="font-sans text-xs text-[#9ca3af]">{label}</div>
      <div className="mt-1 font-sans text-lg text-[#e8e6e3] tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 font-sans text-xs text-[#6b7280]">{hint}</div>}
    </div>
  )
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "quiet"
}) {
  const base =
    "rounded-md px-4 py-2.5 font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B87333]"
  const styles =
    variant === "primary"
      ? "bg-[#B87333] text-[#0a0a0c] hover:bg-[#c98442]"
      : "border border-[#2a2a35] text-[#cfcdc8] hover:border-[#B87333]/50 hover:text-[#B87333]"
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
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
      <span className="font-sans text-xs text-[#9ca3af]">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-[#2a2a35] bg-[#0a0a0c] px-3 focus-within:border-[#B87333]/60">
        <input
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="w-full bg-transparent py-2.5 font-sans text-sm text-[#e8e6e3] outline-none tabular-nums placeholder:text-[#4b5563]"
        />
        <span className="font-sans text-xs text-[#9ca3af]">{symbol}</span>
        {max !== undefined && (
          <button
            type="button"
            onClick={() => onChange(formatUnits(max, 18))}
            className="font-sans text-xs text-[#B87333] hover:underline"
          >
            Max
          </button>
        )}
      </div>
    </label>
  )
}

/* ── helpers ─────────────────────────────────────────────────────── */

function fmt(v: bigint | undefined, dp = 2): string {
  if (v === undefined) return "—"
  const n = Number(formatUnits(v, 18))
  if (n === 0) return "0"
  if (n < 0.01) return "<0.01"
  return n.toLocaleString(undefined, { maximumFractionDigits: dp })
}

function toWei(v: string): bigint {
  try {
    return v.trim() === "" ? 0n : parseUnits(v.trim(), 18)
  } catch {
    return 0n
  }
}

/* ── last compound ───────────────────────────────────────────────── */

/**
 * Timestamp of the most recent Compounded event, or null.
 *
 * Scans back a bounded window rather than from genesis — most public RPCs cap
 * getLogs ranges, and an unbounded scan would either fail or crawl. If nothing
 * is found in the window the display simply hides, which is the right outcome
 * for a vault that has not compounded in weeks.
 */
function useLastCompound(vault: `0x${string}`) {
  const client = usePublicClient()
  const [ts, setTs] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!client) return

    const run = async () => {
      try {
        const latest = await client.getBlockNumber()
        const LOOKBACK = 60_000n // ~7 days at PulseChain's ~10s blocks
        const fromBlock = latest > LOOKBACK ? latest - LOOKBACK : 0n

        const logs = await client.getLogs({
          address: vault,
          event: COMPOUNDED_EVENT,
          fromBlock,
          toBlock: latest,
        })
        if (cancelled || logs.length === 0) {
          if (!cancelled) setTs(null)
          return
        }

        const last = logs[logs.length - 1]
        const block = await client.getBlock({ blockNumber: last.blockNumber })
        if (!cancelled) setTs(Number(block.timestamp))
      } catch {
        // Range limits and rate limits are routine here. Hide rather than fail.
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

/**
 * Lifetime totals for one account, summed from events.
 *
 * The contract stores current state, not history — principal just grows, so
 * without this a depositor has no way to tell what they started with. Summing
 * Settled.compounded gives principal gained from compounding; summing Claimed
 * gives reward token taken.
 *
 * Scanned in chunks from the vault's deploy block, because public RPCs cap
 * getLogs ranges. Both events are indexed on user, so each chunk is cheap.
 */
function useLifetimeEarned(
  vault: `0x${string}`,
  deployBlockInput: bigint | number | string,
  account?: `0x${string}`,
) {
  // Accept a plain number too — a config value written as 24500000 rather
  // than 24500000n would otherwise blow up on the first bigint arithmetic.
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
      setError("deployBlock not set in lib/auto-compounder.ts")
      return
    }

    const run = async () => {
      try {
        const latest = await client.getBlockNumber()
        // Public PulseChain RPCs cap getLogs ranges, often well below 50k.
        // Smaller chunks mean more requests but far fewer outright rejections.
        const CHUNK = 9_000n

        let compounded = 0n
        let claimed = 0n

        for (let from = deployBlock; from <= latest; from += CHUNK) {
          const to = from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n

          const [settled, claims] = await Promise.all([
            client.getLogs({
              address: vault,
              event: SETTLED_EVENT,
              args: { user: account },
              fromBlock: from,
              toBlock: to,
            }),
            client.getLogs({
              address: vault,
              event: CLAIMED_EVENT,
              args: { user: account },
              fromBlock: from,
              toBlock: to,
            }),
          ])

          for (const log of settled) compounded += log.args.compounded ?? 0n
          for (const log of claims) claimed += log.args.amount ?? 0n

          if (cancelled) return
        }

        if (!cancelled) {
          setTotals({ compounded, claimed })
          setError(null)
          console.log(
            `[auto-compound] ${vault} lifetime for ${account}:`,
            { compounded: compounded.toString(), claimed: claimed.toString(),
              scannedFrom: deployBlock.toString(), to: latest.toString() },
          )
        }
      } catch (e) {
        // Surface it rather than hiding — a silently missing figure is much
        // harder to diagnose than a visible one.
        const msg = e instanceof Error ? e.message.split("\n")[0] : String(e)
        console.error("[auto-compound] lifetime scan failed:", e)
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
  }, [client, vault, deployBlock, account])

  return { totals, error }
}

/* ── page ────────────────────────────────────────────────────────── */

export default function AutoCompoundPage() {
  const [active, setActive] = useState<VaultKey>("OPUS")
  const cfg = VAULTS[active]
  const { address, isConnected } = useAccount()

  const [depositAmt, setDepositAmt] = useState("")
  const [withdrawAmt, setWithdrawAmt] = useState("")
  const [pctDraft, setPctDraft] = useState<number | null>(null)

  const [txError, setTxError] = useState<string | null>(null)
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash })
  const busy = isPending || isConfirming

  const { data: vaultData } = useReadContracts({
    contracts: [
      { address: cfg.vault, abi: VAULT_ABI, functionName: "totalPrincipal" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "smaugCirculating" },
    ],
    query: { refetchInterval: 30_000 },
  })

  const totalPrincipal = vaultData?.[0]?.result as bigint | undefined
  const circulating = vaultData?.[1]?.result as bigint | undefined
  const lastCompound = useLastCompound(cfg.vault)
  const { totals: lifetime, error: lifetimeError } = useLifetimeEarned(
    cfg.vault,
    cfg.deployBlock,
    address,
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

  const position = userData?.[0]?.result as
    | readonly [bigint, bigint, bigint, bigint, bigint, bigint, number]
    | undefined

  const [principal, smaugInWallet, tier, , pendingIn, claimable, compoundPct] =
    position ?? [0n, 0n, 100n, 0n, 0n, 0n, 100]

  const walletToken = (userData?.[1]?.result as bigint) ?? 0n
  const allowance = (userData?.[2]?.result as bigint) ?? 0n

  const depositWei = toWei(depositAmt)
  const needsApproval = depositWei > 0n && allowance < depositWei

  // A wallet that has never interacted returns compoundPct = 0 (uninitialised
  // struct). Anyone who has deposited returns 5-100. That distinguishes a
  // first-time depositor from a returning one.
  const isNewDepositor = Number(compoundPct) === 0
  const storedPct = isNewDepositor ? 100 : Number(compoundPct)

  const pct = pctDraft ?? storedPct
  const pctChanged = pctDraft !== null && pctDraft !== storedPct

  // A first-timer who has staged a non-default rate must save it BEFORE
  // depositing: deposit() assigns the 100% default to any wallet that has not
  // been initialised, which would overwrite their choice.
  const rateNeedsTx = isNewDepositor && pctChanged

  const nextTier = useMemo(() => {
    if (!circulating) return null
    return smaugForNextTier(Number(tier), circulating)
  }, [tier, circulating])

  /** Strips viem's multi-paragraph error down to the first useful line. */
  const readableError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e)
    if (/User rejected|denied transaction/i.test(msg)) return null // not an error
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
      {
        onSuccess: () => refetchUser(),
        onError: (e) => setTxError(readableError(e)),
      },
    )
  }

  // Principal shown to the user is what's settled plus what's credited but not
  // yet folded in. The split is an implementation detail.
  const balance = principal + pendingIn

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-[#e8e6e3]">Auto-Compounder</h1>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[#9ca3af]">
          Deposit {cfg.tokenSymbol} and your rewards are swapped for more{" "}
          {cfg.tokenSymbol}. Choose how much to reinvest and how much to take
          as {cfg.rewardSymbol}. Nothing is locked — withdraw whenever you like.
        </p>
      </header>

      <div className="mb-6 inline-flex rounded-md border border-[#2a2a35] p-1">
        {(Object.keys(VAULTS) as VaultKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setActive(k)
              setPctDraft(null)
              setDepositAmt("")
              setWithdrawAmt("")
            }}
            className={`rounded px-4 py-1.5 font-sans text-sm transition-colors ${
              active === k
                ? "bg-[#B87333] text-[#0a0a0c]"
                : "text-[#9ca3af] hover:text-[#e8e6e3]"
            }`}
          >
            {VAULTS[k].tokenSymbol}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-5 rounded-lg border border-[#2a2a35] bg-[#0e0e13] p-5 sm:grid-cols-3">
        <Stat label={`${cfg.tokenSymbol} deposited`} value={fmt(totalPrincipal, 0)} />
        <Stat label="Your tier" value={formatTier(tier)} hint="From Smaug in your wallet" />
        <Stat
          label="Last compounded"
          value={lastCompound ? timeAgo(lastCompound) : "—"}
          hint={lastCompound ? undefined : "No compound in the last week"}
        />
      </div>

      {!isConnected ? (
        <Panel title="Connect to get started">
          <p className="font-sans text-sm text-[#9ca3af]">
            Connect your wallet to deposit {cfg.tokenSymbol} and see your position.
          </p>
          <div className="mt-4">
            <ConnectWalletButton />
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Your position">
            {/* Grouped by token: principal figures above, reward below. */}
            <div className="grid grid-cols-2 gap-5">
              <Stat
                label={`${cfg.tokenSymbol} in the vault`}
                value={fmt(balance)}
                hint={
                  balance > 0n && pct > 0
                    ? `Growing at ${pct}% reinvestment`
                    : undefined
                }
              />
              <Stat
                label="Earned by compounding"
                value={lifetime ? `+${fmt(lifetime.compounded + pendingIn)}` : "—"}
                hint={cfg.tokenSymbol}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-5 border-t border-[#2a2a35] pt-5">
              <Stat
                label={`${cfg.rewardSymbol} ready to claim`}
                value={fmt(claimable)}
              />
              <Stat
                label="Claimed so far"
                value={lifetime ? fmt(lifetime.claimed) : "—"}
                hint={cfg.rewardSymbol}
              />
            </div>

            <div className="mt-4">
              <Button onClick={() => send("claim")} disabled={busy || claimable === 0n}>
                Claim {cfg.rewardSymbol}
              </Button>
            </div>

            {lifetimeError && (
              <p className="mt-3 font-sans text-xs text-[#6b7280]">
                History unavailable: {lifetimeError}
              </p>
            )}
          </Panel>

          <Panel title="Your Smaug tier" aside={<span className="font-sans text-sm text-[#B87333]">{formatTier(tier)}</span>}>
            <p className="font-sans text-sm leading-relaxed text-[#9ca3af]">
              Your tier is read from the Smaug in your wallet. Nothing to deposit,
              nothing to lock — it keeps earning Smaug reflections while it sits
              there.
            </p>

            <div className="mt-4">
              <Stat label="Smaug in your wallet" value={fmt(smaugInWallet, 0)} />
            </div>

            {nextTier ? (
              <p className="mt-4 font-sans text-xs leading-relaxed text-[#6b7280]">
                Hold {fmt(nextTier.smaug, 0)} Smaug to reach {formatTier(nextTier.tier)}.
              </p>
            ) : (
              <p className="mt-4 font-sans text-xs text-[#6b7280]">
                You&apos;re at the highest tier.
              </p>
            )}

            <div className="mt-4">
              <Button
                variant="quiet"
                onClick={() => send("refreshWeight", [address])}
                disabled={busy}
              >
                Refresh my tier
              </Button>
            </div>
            <p className="mt-2 font-sans text-xs leading-relaxed text-[#6b7280]">
              Your tier updates automatically over time. Refresh it yourself if you
              just changed your Smaug balance.
            </p>
          </Panel>

          <Panel
            title="Reinvestment rate"
            aside={<span className="font-sans text-sm text-[#B87333] tabular-nums">{pct}%</span>}
          >
            <p className="font-sans text-sm leading-relaxed text-[#9ca3af]">
              {pct}% of your rewards buys more {cfg.tokenSymbol}.{" "}
              {100 - pct > 0
                ? `The other ${100 - pct}% is yours to claim as ${cfg.rewardSymbol}.`
                : "Nothing is held back to claim."}
            </p>

            <input
              type="range"
              min={MIN_COMPOUND_PCT}
              max={100}
              step={1}
              value={pct}
              onChange={(e) => setPctDraft(Number(e.target.value))}
              className="mt-5 w-full accent-[#B87333]"
              aria-label="Reinvestment rate"
            />
            <div className="mt-1 flex justify-between font-sans text-xs text-[#6b7280]">
              <span>{MIN_COMPOUND_PCT}%</span>
              <span>100%</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPctDraft(p)}
                  className={`rounded border px-3 py-1 font-sans text-xs transition-colors ${
                    pct === p
                      ? "border-[#B87333] text-[#B87333]"
                      : "border-[#2a2a35] text-[#9ca3af] hover:text-[#e8e6e3]"
                  }`}
                >
                  {p}%{p === 100 ? " · default" : ""}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <Button onClick={() => send("setCompoundPct", [pct])} disabled={busy || !pctChanged}>
                {pctChanged ? "Save rate" : "Rate saved"}
              </Button>
            </div>

            <p className="mt-3 font-sans text-xs leading-relaxed text-[#6b7280]">
              {isNewDepositor
                ? "100% is the default — deposit without changing anything and everything you earn is reinvested. Pick another rate here and save it before your first deposit."
                : "Changes apply to rewards from here on."}
            </p>
          </Panel>

          <Panel title={`Deposit ${cfg.tokenSymbol}`}>
            <div className="space-y-4">
              <AmountInput
                label={`Amount — ${fmt(walletToken)} in wallet`}
                value={depositAmt}
                onChange={setDepositAmt}
                max={walletToken}
                symbol={cfg.tokenSymbol}
              />

              <div className="rounded-md border border-[#2a2a35] bg-[#0a0a0c] p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-sans text-xs text-[#9ca3af]">
                    Reinvestment rate{isNewDepositor && !pctChanged ? " (default)" : ""}
                  </span>
                  <span className="font-sans text-sm text-[#B87333] tabular-nums">
                    {pct}%
                  </span>
                </div>
                <p className="mt-2 font-sans text-xs leading-relaxed text-[#6b7280]">
                  {pct === 100
                    ? `Everything you earn buys more ${cfg.tokenSymbol}.`
                    : `${pct}% buys more ${cfg.tokenSymbol}; the other ${
                        100 - pct
                      }% is yours to claim as ${cfg.rewardSymbol}.`}
                  {" Set it in the Reinvestment rate panel."}
                </p>
                {rateNeedsTx && (
                  <p className="mt-2 font-sans text-xs leading-relaxed text-[#B87333]">
                    Press Save rate first — it needs its own transaction, and
                    depositing before it lands would set you to 100%.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {needsApproval && (
                  <Button
                    onClick={() => {
                      setTxError(null)
                      writeContract(
                        {
                          address: cfg.token,
                          abi: ERC20_ABI,
                          functionName: "approve",
                          args: [cfg.vault, maxUint256],
                        },
                        { onError: (e) => setTxError(readableError(e)) },
                      )
                    }}
                    disabled={busy}
                  >
                    Approve {cfg.tokenSymbol}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    send("deposit", [depositWei])
                    setDepositAmt("")
                  }}
                  disabled={busy || needsApproval || rateNeedsTx || depositWei === 0n}
                >
                  Deposit
                </Button>
              </div>
              <p className="font-sans text-xs leading-relaxed text-[#6b7280]">
                You can change your reinvestment rate at any time.
              </p>
            </div>
          </Panel>

          <Panel title="Withdraw">
            <div className="space-y-4">
              <AmountInput
                label={`Amount — ${fmt(balance)} in the vault`}
                value={withdrawAmt}
                onChange={setWithdrawAmt}
                max={principal}
                symbol={cfg.tokenSymbol}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    send("withdraw", [toWei(withdrawAmt)])
                    setWithdrawAmt("")
                  }}
                  disabled={busy || toWei(withdrawAmt) === 0n}
                >
                  Withdraw
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => send("withdrawAll")}
                  disabled={busy || (principal === 0n && claimable === 0n)}
                >
                  Withdraw everything
                </Button>
              </div>
              <p className="font-sans text-xs leading-relaxed text-[#6b7280]">
                No lock-up and no exit fee. Withdrawing leaves your{" "}
                {cfg.rewardSymbol} behind — claim it separately, or use Withdraw
                everything to take both.
              </p>
            </div>
          </Panel>
        </div>
      )}

      {busy && (
        <p className="mt-6 font-sans text-sm text-[#B87333]">Waiting for confirmation…</p>
      )}

      {txError && !busy && (
        <div className="mt-6 rounded-md border border-[#7f1d1d] bg-[#7f1d1d]/10 px-4 py-3">
          <p className="font-sans text-sm text-[#fca5a5]">{txError}</p>
        </div>
      )}
      </main>
    </>
  )
}