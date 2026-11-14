"use client"

import { useMemo, useState } from "react"
import { useAccount, usePublicClient, useReadContracts, useWriteContract } from "wagmi"
import { erc20Abi, formatUnits, getAddress, isAddress, parseAbi, parseEventLogs } from "viem"
import { VAULTS } from "@/lib/yield"

const SMAUG = "0xf4754Aa585caBf38537A68660469A17E203D8632" as const

const VAULT_LIST = Object.values(VAULTS)

const RESCUE_ABI = parseAbi([
  "function owner() view returns (address)",
  "function vaultSmaug() view returns (uint256)",
  "function rescueToken(address token, address to, uint256 amount)",
])

type Status = { state: "sending" | "done" | "error"; hash?: `0x${string}`; message?: string }

interface Row {
  key: string
  name: string
  vault: `0x${string}`
  owner?: `0x${string}`
  smaug: bigint
}

interface PlanItem {
  key: string
  name: string
  vault: `0x${string}`
  amount: bigint
}

function fmtAmount(wei: bigint, decimals: number, dp = 4): string {
  return Number(formatUnits(wei, decimals)).toLocaleString(undefined, { maximumFractionDigits: dp })
}

function short(addr?: string): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—"
}

/**
 * Owner-only: move the SMAUG held by each yield vault to another address with
 * the vault's rescueToken(). SMAUG is not the principal, reward or target token
 * of any vault, so the contract applies no cap to it — it is entirely the
 * owner's seed. Each transfer is simulated first, uses the vault's live SMAUG
 * balance at send time, and is checked against the receipt's Transfer event.
 */
export function SmaugRescuePanel() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const contracts = useMemo(() => {
    const c: any[] = []
    for (const v of VAULT_LIST) {
      c.push({ address: v.vault, abi: RESCUE_ABI, functionName: "owner" })
      c.push({ address: v.vault, abi: RESCUE_ABI, functionName: "vaultSmaug" })
    }
    c.push({ address: SMAUG, abi: erc20Abi, functionName: "decimals" })
    return c
  }, [])

  const { data: reads, isLoading, refetch } = useReadContracts({
    contracts,
    allowFailure: true,
    query: { refetchInterval: 30000 },
  })

  const decimals = useMemo(() => {
    const res = reads?.[reads.length - 1]
    return res?.status === "success" ? Number(res.result) : 18
  }, [reads])

  const rows = useMemo<Row[]>(() => {
    if (!reads) return []
    return VAULT_LIST.map((v, i) => {
      const ownerRes = reads[i * 2]
      const smaugRes = reads[i * 2 + 1]
      return {
        key: v.key,
        name: v.isConverter ? `${v.tokenSymbol} → ${v.targetSymbol}` : `${v.tokenSymbol} Yield`,
        vault: v.vault,
        owner: ownerRes?.status === "success" ? (ownerRes.result as `0x${string}`) : undefined,
        smaug: smaugRes?.status === "success" ? (smaugRes.result as bigint) : 0n,
      }
    })
  }, [reads])

  const [recipient, setRecipient] = useState("")
  const [plan, setPlan] = useState<PlanItem[] | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [error, setError] = useState<string | null>(null)

  const recipientValid = isAddress(recipient.trim())
  const to = recipientValid ? getAddress(recipient.trim()) : undefined
  const recipientIsVault =
    !!to &&
    (to.toLowerCase() === SMAUG.toLowerCase() || VAULT_LIST.some((v) => v.vault.toLowerCase() === to.toLowerCase()))

  const isOwner = (row: Row) => !!address && !!row.owner && address.toLowerCase() === row.owner.toLowerCase()
  const movable = (row: Row) => isOwner(row) && row.smaug > 0n
  const totalMovable = rows.filter(movable).reduce((sum, r) => sum + r.smaug, 0n)
  const canPlan = recipientValid && !recipientIsVault && !running

  function buildPlan(only?: string) {
    setError(null)
    const items = rows
      .filter((r) => movable(r) && (!only || r.key === only))
      .map((r) => ({ key: r.key, name: r.name, vault: r.vault, amount: r.smaug }))
    if (items.length === 0) {
      setError("Nothing to move.")
      return
    }
    setPlan(items)
  }

  async function execute() {
    if (!plan || !to || !address || !publicClient) return
    setRunning(true)
    setError(null)
    setStatus({})
    const items = plan
    setPlan(null)

    for (const item of items) {
      setStatus((s) => ({ ...s, [item.key]: { state: "sending", message: "Checking…" } }))
      try {
        // Live balance at send time, so reflections that arrived since the page loaded are included.
        const amount = (await publicClient.readContract({
          address: item.vault,
          abi: RESCUE_ABI,
          functionName: "vaultSmaug",
        })) as bigint
        if (amount === 0n) {
          setStatus((s) => ({ ...s, [item.key]: { state: "done", message: "Already empty." } }))
          continue
        }

        // Simulate first so a revert shows here, not as a failed on-chain transaction.
        const sim = await publicClient.simulateContract({
          account: address,
          address: item.vault,
          abi: RESCUE_ABI,
          functionName: "rescueToken",
          args: [SMAUG, to, amount],
        })

        setStatus((s) => ({ ...s, [item.key]: { state: "sending", message: "Confirm in your wallet…" } }))
        const hash = await writeContractAsync(sim.request as any)
        setStatus((s) => ({ ...s, [item.key]: { state: "sending", hash, message: "Waiting for confirmation…" } }))

        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        if (receipt.status !== "success") {
          setStatus((s) => ({ ...s, [item.key]: { state: "error", hash, message: "Transaction failed on-chain." } }))
          setError(`${item.name}: transaction failed. Stopped; check the explorer.`)
          break
        }

        const logs = parseEventLogs({ abi: erc20Abi, eventName: "Transfer", logs: receipt.logs })
        const got = logs
          .filter(
            (l) =>
              l.address.toLowerCase() === SMAUG.toLowerCase() &&
              l.args.from.toLowerCase() === item.vault.toLowerCase() &&
              l.args.to.toLowerCase() === to.toLowerCase(),
          )
          .reduce((sum, l) => sum + l.args.value, 0n)

        if (got !== amount) {
          setStatus((s) => ({
            ...s,
            [item.key]: {
              state: "error",
              hash,
              message: `Mined, but the recipient's Transfer event was ${formatUnits(got, decimals)} (expected ${formatUnits(amount, decimals)}).`,
            },
          }))
          setError(`${item.name}: received amount differs from the amount sent. Stopped; check the explorer.`)
          break
        }
        setStatus((s) => ({
          ...s,
          [item.key]: { state: "done", hash, message: `Moved ${formatUnits(amount, decimals)} SMAUG.` },
        }))
      } catch (e: any) {
        const message = e?.shortMessage ?? e?.message ?? "Transaction rejected"
        setStatus((s) => ({ ...s, [item.key]: { state: "error", message } }))
        setError(`${item.name}: ${message}. Stopped.`)
        break
      }
    }

    setRunning(false)
    refetch()
  }

  const btn =
    "rounded border border-[#B87333]/30 bg-[#1a1a20] px-2.5 py-1 font-sans text-[11px] font-semibold text-[#B87333] transition-colors hover:bg-[#2a2a35] disabled:cursor-not-allowed disabled:opacity-40"

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 font-serif text-sm font-semibold text-[#B87333]">Smaug Rescue</h3>
        <p className="font-sans text-[11px] leading-relaxed text-[#7c7a76]">
          Moves the SMAUG held by each vault to the address below, using the owner-only rescueToken().
          SMAUG is the owner&apos;s seed in every vault — users never deposit it — so there is no cap.
          Removing it lowers the vault&apos;s tier, which only affects future reward splits. Transfers
          cannot be undone: check the recipient carefully.
        </p>
        {error && <p className="mt-2 font-sans text-[11px] text-red-400">{error}</p>}
      </div>

      <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
        <label className="font-sans text-xs text-[#7c7a76]" htmlFor="smaug-recipient">
          Recipient address
        </label>
        <input
          id="smaug-recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x…"
          spellCheck={false}
          className="mt-1 w-full rounded border border-[#2a2a35] bg-[#1a1a20] px-3 py-2 font-mono text-xs text-[#e8e6e3] outline-none focus:border-[#B87333]"
        />
        {recipient.trim() !== "" && !recipientValid && (
          <p className="mt-1 font-sans text-[11px] text-red-400">Not a valid address.</p>
        )}
        {recipientIsVault && (
          <p className="mt-1 font-sans text-[11px] text-red-400">The recipient is a vault or the SMAUG token itself.</p>
        )}
        {to && !recipientIsVault && (
          <p className="mt-1 font-sans text-[11px] text-[#7c7a76]">
            Sending to{" "}
            <a
              href={`https://scan.pulsechain.com/address/${to}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[#e8e6e3] hover:text-[#B87333]"
            >
              {to}
            </a>
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="font-sans text-xs text-[#7c7a76]">Total SMAUG you can move</div>
          <div className="mt-1 font-sans text-lg font-semibold text-[#e8e6e3]">
            {isLoading ? "…" : `${fmtAmount(totalMovable, decimals)} SMAUG`}
          </div>
        </div>
        <div className="flex items-center rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
          <button className={btn} disabled={!canPlan || totalMovable === 0n} onClick={() => buildPlan()}>
            Review: move from all vaults
          </button>
        </div>
      </div>

      {plan && to && (
        <div className="rounded-lg border border-[#B87333]/50 bg-[#0d0d12] p-4">
          <div className="font-sans text-sm font-semibold text-[#e8e6e3]">
            Confirm {plan.length} transfer{plan.length === 1 ? "" : "s"} to
          </div>
          <div className="mt-1 break-all font-mono text-xs text-[#B87333]">{to}</div>
          <ul className="mt-3 space-y-1 font-sans text-xs text-[#b8b6b1]">
            {plan.map((p) => (
              <li key={p.key}>
                {p.name}: {formatUnits(p.amount, decimals)} SMAUG
              </li>
            ))}
          </ul>
          <p className="mt-3 font-sans text-[11px] text-[#7c7a76]">
            Each transfer is simulated first and sent one after another. Your wallet will ask you to approve
            each one. It stops at the first problem. The amount is each vault&apos;s balance at send time.
          </p>
          <div className="mt-3 flex gap-2">
            <button className={btn} onClick={execute}>
              Confirm and send
            </button>
            <button className={btn} onClick={() => setPlan(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="py-4 font-sans text-sm text-[#7c7a76]">Loading vault balances…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => {
            const st = status[row.key]
            return (
              <div key={row.key} className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="font-sans text-sm font-semibold text-[#e8e6e3]">{row.name}</span>
                  <span className="font-mono text-[10px] text-[#7c7a76]">
                    {isOwner(row) ? "owner ✓" : `owner ${short(row.owner)}`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-sans text-xs text-[#7c7a76]">SMAUG held</span>
                  <span className="font-sans text-sm font-semibold text-[#B87333]">
                    {fmtAmount(row.smaug, decimals)} SMAUG
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className={btn} disabled={!canPlan || !movable(row)} onClick={() => buildPlan(row.key)}>
                    Review: move this vault
                  </button>
                  {st && (
                    <span
                      className={`font-sans text-[11px] ${
                        st.state === "error" ? "text-red-400" : st.state === "done" ? "text-green-400" : "text-[#7c7a76]"
                      }`}
                    >
                      {st.message}{" "}
                      {st.hash && (
                        <a
                          href={`https://scan.pulsechain.com/tx/${st.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          tx
                        </a>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => refetch()}
        className="rounded border border-[#B87333]/30 bg-[#1a1a20] px-3 py-1.5 font-sans text-xs font-semibold text-[#B87333] transition-colors hover:bg-[#2a2a35]"
      >
        Refresh
      </button>
    </div>
  )
}