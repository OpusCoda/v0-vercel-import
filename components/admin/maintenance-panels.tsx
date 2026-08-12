'use client'

import { useState } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking'
import { writeContract as writeContractAction } from '@wagmi/core'
import { config } from '@/lib/wagmi'

// ─────────────────────────────────────────────────────────────────────────
// Two separate admin panels: one for processBurn, one for sweepAbandonedRewards.
// Each reads its paginated list getter and runs a sequential batch — one tx per
// stake, awaited in turn — so you can watch each list drain to zero on its own.
//
// Both underlying functions are permissionless in the contract; these live in
// admin purely as an ops convenience.
// ─────────────────────────────────────────────────────────────────────────

export function ProcessBurnPanel() {
  return (
    <BatchPanel
      title="Process burn schedule"
      description="Stakes past their grace period with burn-schedule forfeiture due. Processing applies the forfeiture and removes matured stakes from the reward pools."
      listFn="getProcessableStakes"
      actionFn="processBurn"
      verb="Process"
      gerund="Processing"
    />
  )
}

export function SweepAbandonedPanel() {
  return (
    <BatchPanel
      title="Sweep abandoned rewards"
      description="Stakes whose full burn schedule has completed with rewards still pending. Sweeping redistributes those rewards to active stakers."
      listFn="getSweepableStakes"
      actionFn="sweepAbandonedRewards"
      verb="Sweep"
      gerund="Sweeping"
    />
  )
}

function BatchPanel({
  title,
  description,
  listFn,
  actionFn,
  verb,
  gerund,
}: {
  title: string
  description: string
  listFn: 'getProcessableStakes' | 'getSweepableStakes'
  actionFn: 'processBurn' | 'sweepAbandonedRewards'
  verb: string
  gerund: string
}) {
  const contract = {
    address: STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
  } as const

  const { data: countData } = useReadContract({ ...contract, functionName: 'stakeCount' })
  const stakeCount = countData !== undefined ? (countData as bigint) : 0n

  const { data: listData, refetch, isLoading } = useReadContract({
    ...contract,
    functionName: listFn,
    args: [0n, stakeCount],
    query: { enabled: stakeCount > 0n, refetchInterval: 30000 },
  })

  const ids = (listData as bigint[] | undefined) ?? []

  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [failedId, setFailedId] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  const runBatch = async () => {
    if (ids.length === 0) return
    setRunning(true)
    setFinished(false)
    setFailedId(null)
    setProgress({ done: 0, total: ids.length })

    for (let i = 0; i < ids.length; i++) {
      try {
        const hash = await writeContractAction(config, {
          address: STAKING_CONTRACT as `0x${string}`,
          abi: STAKING_ABI,
          functionName: actionFn,
          args: [ids[i]],
        })
        // Wait for inclusion before moving on, so state (and the list) is current.
        const { waitForTransactionReceipt } = await import('@wagmi/core')
        await waitForTransactionReceipt(config, { hash })
        setProgress({ done: i + 1, total: ids.length })
      } catch {
        // A stake may become non-actionable between read and send, or the user
        // rejects — stop and report which one.
        setFailedId(ids[i].toString())
        break
      }
    }

    setRunning(false)
    setFinished(true)
    refetch()
  }

  return (
    <div className="rounded-lg border border-[#2a2a35] bg-[#101017] p-6">
      <h3 className="font-serif text-lg font-semibold text-[#e8e6e3]">{title}</h3>
      <p className="mt-1 mb-4 font-sans text-xs text-[#7c7a76]">{description}</p>

      {isLoading ? (
        <p className="font-sans text-sm text-[#7c7a76]">Scanning stakes…</p>
      ) : ids.length === 0 ? (
        <p className="font-sans text-sm text-[#7c7a76]">Nothing to {verb.toLowerCase()} right now.</p>
      ) : (
        <>
          <p className="mb-3 font-sans text-sm text-[#b8b6b1]">
            <span className="font-semibold text-[#B87333]">{ids.length}</span>{' '}
            stake{ids.length === 1 ? '' : 's'} ready to {verb.toLowerCase()}.
          </p>

          <button
            onClick={runBatch}
            disabled={running}
            className="w-full rounded-lg border border-[#B87333]/40 bg-[#B87333]/10 py-2.5 font-sans text-sm font-semibold text-[#B87333] transition-colors hover:bg-[#B87333]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running && progress
              ? `${gerund} ${progress.done + 1} of ${progress.total}…`
              : `${verb} all ${ids.length}`}
          </button>

          <p className="mt-2 font-sans text-[10px] text-[#7c7a76]">
            One wallet confirmation per stake — you'll be prompted {ids.length} time{ids.length === 1 ? '' : 's'}.
          </p>
        </>
      )}

      {finished && !failedId && progress && (
        <p className="mt-3 font-sans text-xs text-green-400">
          ✓ {gerund} complete — {progress.done} of {progress.total} done.
        </p>
      )}
      {failedId && progress && (
        <p className="mt-3 font-sans text-xs text-red-400">
          Stopped at stake #{failedId} after {progress.done} of {progress.total}. Re-run to continue with the rest.
        </p>
      )}
    </div>
  )
}