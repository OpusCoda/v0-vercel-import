"use client"

import { useMemo } from "react"
import { useReadContracts } from "wagmi"
import { formatUnits } from "viem"
import { VAULTS, VAULT_ABI, type VaultKey } from "@/lib/yield"

const VAULT_LIST = Object.values(VAULTS)

function fmtAmount(wei: bigint, decimals = 18, dp = 2): string {
  return Number(formatUnits(wei, decimals)).toLocaleString(undefined, { maximumFractionDigits: dp })
}

interface SurplusRow {
  key: VaultKey
  name: string
  vault: `0x${string}`
  rewardSymbol: string
  targetSymbol: string
  targetDecimals: number
  isConverter: boolean
  surplus: bigint
  excessTarget?: bigint
}

/**
 * Owner-only view of accruedSurplus (PLS/PLSX skimmed from the tier-boost
 * gap) across every yield vault, plus target-token excess for converter
 * vaults whose target carries its own reflections (e.g. pTGC, UFO) —
 * tokens that land on the contract outside the normal compound/convert
 * flow and never touch totalReservedTarget.
 */
export function VaultSurplusPanel() {
  const contracts = useMemo(() => {
    const c: any[] = []
    for (const v of VAULT_LIST) {
      c.push({ address: v.vault, abi: VAULT_ABI, functionName: "accruedSurplus" })
      if (v.isConverter) {
        c.push({ address: v.vault, abi: VAULT_ABI, functionName: "targetBalance" })
        c.push({ address: v.vault, abi: VAULT_ABI, functionName: "totalReservedTarget" })
      }
    }
    return c
  }, [])

  const { data: reads, isLoading, refetch } = useReadContracts({
    contracts,
    allowFailure: true,
    query: { refetchInterval: 60000 },
  })

  const rows = useMemo<SurplusRow[]>(() => {
    if (!reads) return []
    const out: SurplusRow[] = []
    let idx = 0
    for (const v of VAULT_LIST) {
      const surplusRes = reads[idx++]
      let excessTarget: bigint | undefined
      if (v.isConverter) {
        const targetBalRes = reads[idx++]
        const reservedRes = reads[idx++]
        if (targetBalRes?.status === "success" && reservedRes?.status === "success") {
          const targetBal = targetBalRes.result as bigint
          const reserved = reservedRes.result as bigint
          excessTarget = targetBal > reserved ? targetBal - reserved : 0n
        }
      }
      out.push({
        key: v.key,
        name: v.isConverter ? `${v.tokenSymbol} → ${v.targetSymbol}` : `${v.tokenSymbol} Yield`,
        vault: v.vault,
        rewardSymbol: v.rewardSymbol,
        targetSymbol: v.targetSymbol,
        targetDecimals: v.targetDecimals,
        isConverter: v.isConverter,
        surplus: surplusRes?.status === "success" ? (surplusRes.result as bigint) : 0n,
        excessTarget,
      })
    }
    return out
  }, [reads])

  const totals = useMemo(() => {
    let pls = 0n
    let plsx = 0n
    for (const row of rows) {
      if (row.rewardSymbol === "PLS") pls += row.surplus
      else if (row.rewardSymbol === "PLSX") plsx += row.surplus
    }
    return { pls, plsx }
  }, [rows])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 font-serif text-sm font-semibold text-[#B87333]">Vault Surplus</h3>
        <p className="font-sans text-[11px] leading-relaxed text-[#7c7a76]">
          accruedSurplus is PLS/PLSX skimmed from the tier-boost gap on each yield vault —
          withdrawable via withdrawSurplus() or convertSurplusToTarget(). Target-token excess is
          reflections or other tokens that landed on the contract outside the normal
          compound/convert flow — withdrawable via rescueToken().
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="font-sans text-xs text-[#7c7a76]">Total PLS surplus</div>
          <div className="mt-1 font-sans text-lg font-semibold text-[#e8e6e3]">
            {isLoading ? "…" : `${fmtAmount(totals.pls)} PLS`}
          </div>
        </div>
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="font-sans text-xs text-[#7c7a76]">Total PLSX surplus</div>
          <div className="mt-1 font-sans text-lg font-semibold text-[#e8e6e3]">
            {isLoading ? "…" : `${fmtAmount(totals.plsx)} PLSX`}
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="py-4 font-sans text-sm text-[#7c7a76]">Loading vault surplus…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <div key={row.key} className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
              <div className="mb-2 font-sans text-sm font-semibold text-[#e8e6e3]">{row.name}</div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-sans text-xs text-[#7c7a76]">{row.rewardSymbol} surplus</span>
                <span className="font-sans text-sm font-semibold text-[#B87333]">
                  {fmtAmount(row.surplus)} {row.rewardSymbol}
                </span>
              </div>
              {row.isConverter && row.excessTarget !== undefined && row.excessTarget > 0n && (
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <span className="font-sans text-xs text-[#7c7a76]">{row.targetSymbol} excess</span>
                  <span className="font-sans text-sm font-semibold text-orange-400">
                    +{fmtAmount(row.excessTarget, row.targetDecimals)} {row.targetSymbol}
                  </span>
                </div>
              )}
            </div>
          ))}
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
