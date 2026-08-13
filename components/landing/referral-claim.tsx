"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatEther } from "viem"
import type { Address } from "viem"
import { Coins } from "lucide-react"
import { predictionMarketAbi } from "@/lib/abis/prediction-market"
import { outcomeExchangeAbi } from "@/lib/abis/outcome-exchange"

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ("0x77b004A0029d725e353E5EE0D80102516A4e52a8" as Address)
const OUTCOME_EXCHANGE_ADDRESS = "0x5c806d98Ab3fBAA7eDFa04749F69580E1f753167" as Address

function fmtPls(wei: bigint): string {
  return Number(formatEther(wei)).toLocaleString("en-US", { maximumFractionDigits: 2 })
}

/**
 * Reads on-chain referral rewards from both protocols and lets the referrer
 * claim each separately. pendingRewards is index 5 of getReferralInfo().
 * Rewards accrue and are claimed per-contract, so two balances, two buttons.
 */
export function ReferralClaim() {
  const { address, isConnected } = useAccount()

  if (!isConnected || !address) {
    return (
      <div className="mt-6 rounded-2xl border border-[#2a2a35] bg-[#101017] p-6 text-center">
        <div className="flex items-center justify-center gap-2 font-sans text-[11px] uppercase tracking-[0.12em] text-[#9ca3af]">
          <Coins className="h-4 w-4 text-[#B87333]" aria-hidden />
          Referral rewards
        </div>
        <p className="mt-2 font-sans text-sm text-[#b8b6b1]">
          Connect your wallet to view and claim referral rewards earned from the Probability Shop and Wager Market.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <ClaimCard
        label="Probability Shop"
        contractAddress={PREDICTION_MARKET_ADDRESS}
        abi={predictionMarketAbi}
        user={address}
      />
      <ClaimCard
        label="Wager Market"
        contractAddress={OUTCOME_EXCHANGE_ADDRESS}
        abi={outcomeExchangeAbi}
        user={address}
      />
    </div>
  )
}

function ClaimCard({
  label,
  contractAddress,
  abi,
  user,
}: {
  label: string
  contractAddress: Address
  abi: typeof predictionMarketAbi | typeof outcomeExchangeAbi
  user: Address
}) {
  const { data: info, refetch } = useReadContract({
    address: contractAddress,
    abi,
    functionName: "getReferralInfo",
    args: [user],
    query: { refetchInterval: 20000 },
  })

  // getReferralInfo → [referredByAddr, startTime, isActive, expiresAt, discountBps, pendingRewards, peopleReferred]
  const pending = info ? (info as readonly unknown[])[5] as bigint : 0n
  const hasRewards = pending > 0n

  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (isSuccess) refetch()

  const handleClaim = () => {
    writeContract({
      address: contractAddress,
      abi,
      functionName: "claimReferralRewards",
    })
  }

  return (
    <div className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-6">
      <div className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.12em] text-[#9ca3af]">
        <Coins className="h-4 w-4 text-[#B87333]" aria-hidden />
        {label} rewards
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-serif text-2xl font-bold text-[#e8e6e3]">{fmtPls(pending)}</span>
        <span className="font-sans text-sm text-[#9ca3af]">PLS</span>
      </div>

      {isSuccess ? (
        <p className="mt-4 font-sans text-sm text-green-400">✓ Claimed.</p>
      ) : (
        <button
          type="button"
          onClick={handleClaim}
          disabled={!hasRewards || isPending || confirming}
          className="mt-4 w-full rounded-lg bg-[#B87333] px-5 py-2.5 font-sans text-sm font-semibold text-[#0a0a0c] transition-colors hover:bg-[#c19b2e] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Confirm in wallet…" : confirming ? "Claiming…" : hasRewards ? "Claim PLS" : "Nothing to claim"}
        </button>
      )}

      {error && <p className="mt-2 font-sans text-xs text-[#e06a5e]">Transaction failed — see wallet.</p>}
    </div>
  )
}