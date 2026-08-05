"use client"
import { useEffect } from "react"
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi"
import { formatUnits } from "viem"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from "@/lib/wager-market"
const PREDICTION_MARKET_ADDRESS = "0x1e6b4f6426CBFF980F70B6eF79FBaa8507f6e90A"
function fmtPls(wei: bigint, dp = 2): string {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: dp })
}
// One labelled figure.
function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="font-sans text-xs text-[#7c7a76]">
        {label}
        {hint && <span className="ml-1 text-[10px] text-[#57565a]">({hint})</span>}
      </div>
      <div className="font-sans text-sm font-semibold text-[#e8e6e3]">{value} PLS</div>
    </div>
  )
}
// A claim button + its accrued balance for one contract.
function ClaimCard({
  title,
  claimable,
  onClaim,
  isPending,
  isConfirming,
  isSuccess,
  disabled,
}: {
  title: string
  claimable: bigint
  onClaim: () => void
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  disabled: boolean
}) {
  let label = "Withdraw"
  if (isSuccess) label = "Withdrawn ✓"
  else if (isPending) label = "Confirm in wallet…"
  else if (isConfirming) label = "Withdrawing…"
  const nothing = claimable === 0n
  return (
    <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
      <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-[#7c7a76]">
        {title}
      </div>
      <div className="mb-3 font-sans text-xl font-bold text-[#d4af37]">{fmtPls(claimable)} PLS</div>
      <button
        onClick={onClaim}
        disabled={disabled || nothing || isPending || isConfirming || isSuccess}
        className="w-full rounded border border-[#d4af37]/30 bg-[#1a1a20] py-1.5 font-sans text-xs font-semibold text-[#d4af37] transition-colors hover:bg-[#2a2a35] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nothing ? "Nothing to withdraw" : label}
      </button>
    </div>
  )
}
/**
 * Owner-only revenue panel. Renders NOTHING unless the connected wallet is the
 * PredictionMarket owner — gate it further at the page level too. Shows:
 *   • Claimable dev fees per contract (with withdraw buttons)
 *   • Lifetime revenue context (volume, total fees, staker fees, payouts)
 *   • Referral liabilities owed out
 */
export function RevenuePanel() {
  const { address } = useAccount()
  const pmContract = {
    address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
    abi: predictionMarketAbi,
    query: { refetchInterval: 30000 },
  } as const
  const oeContract = {
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    query: { refetchInterval: 30000 },
  } as const
  // ── Claimable dev balances (the actionable numbers) ──
  const { data: pmClaimable, refetch: refetchPmClaimable } = useReadContract({
    ...pmContract,
    functionName: "protocolFeeAccrued",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })
  const { data: oeClaimable, refetch: refetchOeClaimable } = useReadContract({
    ...oeContract,
    functionName: "protocolFeeAccrued",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  })
  // ── PredictionMarket lifetime context ──
  const { data: pmVolume } = useReadContract({ ...pmContract, functionName: "cumulativeVolume" })
  const { data: pmTotalFees } = useReadContract({ ...pmContract, functionName: "totalProtocolFees" })
  const { data: pmReferralLiab } = useReadContract({ ...pmContract, functionName: "totalReferralLiabilities" })
  // ── WagerMarket (Outcome Exchange) lifetime context ──
  const { data: oeVolume } = useReadContract({ ...oeContract, functionName: "totalVolume" })
  const { data: oeTotalFees } = useReadContract({ ...oeContract, functionName: "totalProtocolFees" })
  const { data: oeStakerFees } = useReadContract({ ...oeContract, functionName: "totalStakerFees" })
  const { data: oePayouts } = useReadContract({ ...oeContract, functionName: "totalPayouts" })
  const { data: oeReferralLiab } = useReadContract({ ...oeContract, functionName: "totalReferralLiabilities" })
  // ── Withdraw writes ──
  const {
    writeContract: writePm,
    data: pmTx,
    isPending: pmPending,
  } = useWriteContract()
  const { isLoading: pmConfirming, isSuccess: pmSuccess } = useWaitForTransactionReceipt({
    hash: pmTx,
    query: { enabled: !!pmTx },
  })
  const {
    writeContract: writeOe,
    data: oeTx,
    isPending: oePending,
  } = useWriteContract()
  const { isLoading: oeConfirming, isSuccess: oeSuccess } = useWaitForTransactionReceipt({
    hash: oeTx,
    query: { enabled: !!oeTx },
  })
  // Refetch balances after a successful withdraw.
  useEffect(() => {
    if (pmSuccess) refetchPmClaimable()
  }, [pmSuccess, refetchPmClaimable])
  useEffect(() => {
    if (oeSuccess) refetchOeClaimable()
  }, [oeSuccess, refetchOeClaimable])
  const pmClaimWei = (pmClaimable as bigint) ?? 0n
  const oeClaimWei = (oeClaimable as bigint) ?? 0n
  return (
    <div className="space-y-6">
      {/* Claimable — the actionable part */}
      <div>
        <h3 className="mb-3 font-serif text-sm font-semibold text-[#d4af37]">Claimable revenue</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <ClaimCard
            title="Probability Shop — dev fees"
            claimable={pmClaimWei}
            onClaim={() =>
              writePm({
                address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
                abi: predictionMarketAbi,
                functionName: "withdrawProtocolFees",
              })
            }
            isPending={pmPending}
            isConfirming={pmConfirming}
            isSuccess={pmSuccess}
            disabled={!address}
          />
          <ClaimCard
            title="Outcome Exchange — dev fees"
            claimable={oeClaimWei}
            onClaim={() =>
              writeOe({
                address: WAGER_MARKET_ADDRESS,
                abi: WAGER_MARKET_ABI,
                functionName: "withdrawFees",
              })
            }
            isPending={oePending}
            isConfirming={oeConfirming}
            isSuccess={oeSuccess}
            disabled={!address}
          />
        </div>
      </div>
      {/* Lifetime context — two columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="mb-2 font-sans text-xs font-semibold text-[#b8b6b1]">Probability Shop — lifetime</div>
          <Row label="Cumulative volume" value={fmtPls((pmVolume as bigint) ?? 0n)} />
          <Row label="Total protocol fees" value={fmtPls((pmTotalFees as bigint) ?? 0n)} hint="all recipients" />
          <Row label="Referral rewards owed" value={fmtPls((pmReferralLiab as bigint) ?? 0n)} hint="liability" />
        </div>
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="mb-2 font-sans text-xs font-semibold text-[#b8b6b1]">Outcome Exchange — lifetime</div>
          <Row label="Total volume" value={fmtPls((oeVolume as bigint) ?? 0n)} />
          <Row label="Total protocol fees" value={fmtPls((oeTotalFees as bigint) ?? 0n)} />
          <Row label="Sent to stakers" value={fmtPls((oeStakerFees as bigint) ?? 0n)} />
          <Row label="Paid to winners" value={fmtPls((oePayouts as bigint) ?? 0n)} />
          <Row label="Referral rewards owed" value={fmtPls((oeReferralLiab as bigint) ?? 0n)} hint="liability" />
        </div>
      </div>
      <p className="font-sans text-[10px] leading-relaxed text-[#57565a]">
        Claimable balances are your dev share, withdrawable now. Lifetime figures are cumulative
        across all users and recipients — protocol fees include the staker and seeder shares, not
        just your cut. All values in PLS.
      </p>
    </div>
  )
}