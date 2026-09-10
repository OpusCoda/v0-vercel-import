// app/auto-compound/page.tsx
"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { formatUnits, parseUnits, maxUint256 } from "viem"
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi"
import {
  VAULTS,
  VAULT_ABI,
  ERC20_ABI,
  SMAUG_ADDRESS,
  MIN_COMPOUND_PCT,
  formatTier,
  smaugForNextTier,
  type VaultKey,
} from "@/lib/auto-compounder"

/* ── small presentational pieces ─────────────────────────────────── */

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
      <div className="mt-1 font-sans text-lg text-[#e8e6e3] tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 font-sans text-xs text-[#6b7280]">{hint}</div>
      )}
    </div>
  )
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  full,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "quiet"
  full?: boolean
}) {
  const base =
    "rounded-md px-4 py-2.5 font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B87333]"
  const styles =
    variant === "primary"
      ? "bg-[#B87333] text-[#0a0a0c] hover:bg-[#c98442]"
      : "border border-[#2a2a35] text-[#cfcdc8] hover:border-[#B87333]/50 hover:text-[#B87333]"
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${full ? "w-full" : ""}`}
    >
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

/* ── page ────────────────────────────────────────────────────────── */

export default function AutoCompoundPage() {
  const [active, setActive] = useState<VaultKey>("OPUS")
  const cfg = VAULTS[active]
  const { address, isConnected } = useAccount()

  const [depositAmt, setDepositAmt] = useState("")
  const [smaugAmt, setSmaugAmt] = useState("")
  const [withdrawAmt, setWithdrawAmt] = useState("")
  const [withdrawSmaug, setWithdrawSmaug] = useState("")
  const [pctDraft, setPctDraft] = useState<number | null>(null)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  const busy = isPending || isConfirming

  /* vault-wide reads */
  const { data: vaultData } = useReadContracts({
    contracts: [
      { address: cfg.vault, abi: VAULT_ABI, functionName: "vaultTier" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "totalPrincipal" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "totalSmaug" },
      { address: cfg.vault, abi: VAULT_ABI, functionName: "smaugCirculating" },
    ],
    query: { refetchInterval: 30_000 },
  })

  const vaultTier = vaultData?.[0]?.result as bigint | undefined
  const totalPrincipal = vaultData?.[1]?.result as bigint | undefined
  const circulating = vaultData?.[3]?.result as bigint | undefined

  /* per-user reads */
  const { data: userData, refetch: refetchUser } = useReadContracts({
    contracts: address
      ? [
          {
            address: cfg.vault,
            abi: VAULT_ABI,
            functionName: "positionOf",
            args: [address],
          },
          {
            address: cfg.token,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: cfg.token,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, cfg.vault],
          },
          {
            address: SMAUG_ADDRESS,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: SMAUG_ADDRESS,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [address, cfg.vault],
          },
        ]
      : [],
    query: { enabled: !!address, refetchInterval: 15_000 },
  })

  const position = userData?.[0]?.result as
    | readonly [bigint, bigint, bigint, bigint, bigint, bigint, number]
    | undefined

  const [principal, smaugStaked, tier, , pendingIn, claimable, compoundPct] =
    position ?? [0n, 0n, 100n, 0n, 0n, 0n, 100]

  const walletToken = (userData?.[1]?.result as bigint) ?? 0n
  const tokenAllowance = (userData?.[2]?.result as bigint) ?? 0n
  const walletSmaug = (userData?.[3]?.result as bigint) ?? 0n
  const smaugAllowance = (userData?.[4]?.result as bigint) ?? 0n

  const depositWei = toWei(depositAmt)
  const smaugWei = toWei(smaugAmt)
  const needsTokenApproval = depositWei > 0n && tokenAllowance < depositWei
  const needsSmaugApproval = smaugWei > 0n && smaugAllowance < smaugWei

  const pct = pctDraft ?? Number(compoundPct)
  const pctChanged = pctDraft !== null && pctDraft !== Number(compoundPct)

  const nextTier = useMemo(() => {
    if (!circulating) return null
    return smaugForNextTier(Number(tier), circulating)
  }, [tier, circulating])

  const send = (fn: string, args: readonly unknown[] = []) =>
    writeContract(
      { address: cfg.vault, abi: VAULT_ABI, functionName: fn as never, args: args as never },
      { onSuccess: () => refetchUser() },
    )

  const approve = (token: `0x${string}`) =>
    writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [cfg.vault, maxUint256],
    })

  const notDeployed =
    cfg.vault === "0x0000000000000000000000000000000000000000"

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-[#e8e6e3]">Auto-Compounder</h1>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[#9ca3af]">
          Deposit {cfg.tokenSymbol} and your rewards are bought back into more{" "}
          {cfg.tokenSymbol} for you. Choose how much to reinvest and how much to
          take as {cfg.rewardSymbol}. Add Smaug to raise your reward tier.
          Withdraw whenever you like — nothing is locked.
        </p>
        <p className="mt-3 font-sans text-sm text-[#6b7280]">
          Looking to lock Smaug for a bigger multiplier?{" "}
          <Link href="/stake" className="text-[#B87333] hover:underline">
            Staking
          </Link>{" "}
          works differently.
        </p>
      </header>

      {/* token switch */}
      <div className="mb-6 inline-flex rounded-md border border-[#2a2a35] p-1">
        {(Object.keys(VAULTS) as VaultKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setActive(k)
              setPctDraft(null)
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

      {notDeployed && (
        <div className="mb-6 rounded-md border border-[#B87333]/40 bg-[#B87333]/5 px-4 py-3 font-sans text-sm text-[#cfcdc8]">
          The {cfg.tokenSymbol} vault isn&apos;t live yet. Check back shortly.
        </div>
      )}

      {/* vault summary */}
      <div className="mb-6 grid grid-cols-2 gap-5 rounded-lg border border-[#2a2a35] bg-[#0e0e13] p-5 sm:grid-cols-3">
        <Stat
          label="Vault reward tier"
          value={vaultTier ? formatTier(vaultTier) : "—"}
          hint="Applied to everything the vault earns"
        />
        <Stat
          label={`${cfg.tokenSymbol} deposited`}
          value={fmt(totalPrincipal, 0)}
        />
        <Stat label="Your tier" value={formatTier(tier)} />
      </div>

      {!isConnected ? (
        <Panel title="Connect to get started">
          <p className="font-sans text-sm text-[#9ca3af]">
            Connect your wallet to deposit {cfg.tokenSymbol} and see your
            position.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* position */}
          <Panel title="Your position">
            <div className="grid grid-cols-2 gap-5">
              <Stat
                label={`${cfg.tokenSymbol} deposited`}
                value={fmt(principal)}
                hint={pendingIn > 0n ? `+${fmt(pendingIn)} pending` : undefined}
              />
              <Stat label="Smaug added" value={fmt(smaugStaked, 0)} />
            </div>

            {nextTier && (
              <p className="mt-4 font-sans text-xs leading-relaxed text-[#6b7280]">
                Add {fmt(nextTier.smaug - smaugStaked, 0)} more Smaug to reach{" "}
                {formatTier(nextTier.tier)}.
              </p>
            )}

            <div className="mt-5 border-t border-[#2a2a35] pt-5">
              <Stat
                label={`${cfg.rewardSymbol} ready to claim`}
                value={fmt(claimable)}
              />
              <div className="mt-3">
                <Button
                  onClick={() => send("claim")}
                  disabled={busy || claimable === 0n}
                >
                  Claim {cfg.rewardSymbol}
                </Button>
              </div>
            </div>
          </Panel>

          {/* compound rate */}
          <Panel
            title="Reinvestment rate"
            aside={
              <span className="font-sans text-sm text-[#B87333] tabular-nums">
                {pct}%
              </span>
            }
          >
            <p className="font-sans text-sm leading-relaxed text-[#9ca3af]">
              {pct}% of your rewards buys more {cfg.tokenSymbol}.{" "}
              {100 - pct > 0
                ? `The other ${100 - pct}% is yours to claim as ${cfg.rewardSymbol}.`
                : `Nothing is held back to claim.`}
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
                  {p}%
                </button>
              ))}
            </div>

            <div className="mt-5">
              <Button
                onClick={() => send("setCompoundPct", [pct])}
                disabled={busy || !pctChanged}
              >
                {pctChanged ? "Save rate" : "Rate saved"}
              </Button>
            </div>

            <p className="mt-3 font-sans text-xs leading-relaxed text-[#6b7280]">
              Changes apply to rewards from here on. Anything already earned
              keeps the split it was earned under.
            </p>
          </Panel>

          {/* deposit */}
          <Panel title={`Deposit ${cfg.tokenSymbol}`}>
            <div className="space-y-4">
              <AmountInput
                label={`Amount — ${fmt(walletToken)} in wallet`}
                value={depositAmt}
                onChange={setDepositAmt}
                max={walletToken}
                symbol={cfg.tokenSymbol}
              />
              <AmountInput
                label={`Smaug, optional — ${fmt(walletSmaug, 0)} in wallet`}
                value={smaugAmt}
                onChange={setSmaugAmt}
                max={walletSmaug}
                symbol="SMAUG"
              />
              <p className="font-sans text-xs leading-relaxed text-[#6b7280]">
                Smaug you deposit here sets your tier. Smaug left in your wallet
                doesn&apos;t count toward it.
              </p>

              <div className="flex flex-wrap gap-2">
                {needsTokenApproval && (
                  <Button onClick={() => approve(cfg.token)} disabled={busy}>
                    Approve {cfg.tokenSymbol}
                  </Button>
                )}
                {needsSmaugApproval && (
                  <Button onClick={() => approve(SMAUG_ADDRESS)} disabled={busy}>
                    Approve Smaug
                  </Button>
                )}
                <Button
                  onClick={() => {
                    send("deposit", [depositWei, smaugWei])
                    setDepositAmt("")
                    setSmaugAmt("")
                  }}
                  disabled={
                    busy ||
                    notDeployed ||
                    needsTokenApproval ||
                    needsSmaugApproval ||
                    (depositWei === 0n && smaugWei === 0n)
                  }
                >
                  Deposit
                </Button>
              </div>
            </div>
          </Panel>

          {/* withdraw */}
          <Panel title="Withdraw">
            <div className="space-y-4">
              <AmountInput
                label={`${cfg.tokenSymbol} — ${fmt(principal)} deposited`}
                value={withdrawAmt}
                onChange={setWithdrawAmt}
                max={principal}
                symbol={cfg.tokenSymbol}
              />
              <AmountInput
                label={`Smaug — ${fmt(smaugStaked, 0)} deposited`}
                value={withdrawSmaug}
                onChange={setWithdrawSmaug}
                max={smaugStaked}
                symbol="SMAUG"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    send("withdraw", [toWei(withdrawAmt), toWei(withdrawSmaug)])
                    setWithdrawAmt("")
                    setWithdrawSmaug("")
                  }}
                  disabled={
                    busy ||
                    (toWei(withdrawAmt) === 0n && toWei(withdrawSmaug) === 0n)
                  }
                >
                  Withdraw
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => send("withdrawAll")}
                  disabled={
                    busy ||
                    (principal === 0n && smaugStaked === 0n && claimable === 0n)
                  }
                >
                  Withdraw everything
                </Button>
              </div>

              <p className="font-sans text-xs leading-relaxed text-[#6b7280]">
                No lock-up and no exit fee. Withdrawing Smaug lowers your tier.
              </p>
            </div>
          </Panel>
        </div>
      )}

      {busy && (
        <p className="mt-6 font-sans text-sm text-[#B87333]">
          Waiting for confirmation…
        </p>
      )}
    </main>
  )
}