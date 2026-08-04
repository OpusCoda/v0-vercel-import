'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { isAddress, getAddress } from 'viem'
import type { Address } from 'viem'
import { outcomeExchangeAbi } from '@/lib/abis/outcome-exchange'

const OUTCOME_EXCHANGE_ADDRESS = '0x4B5da4B6b4607B5bA054511ef6bD83742287e18F' as Address

// From the contract: max 5 arbitrators, threshold 3.
const MAX_ARBITRATORS = 5
const ARBITRATION_THRESHOLD = 3

type Mode = 'add' | 'remove'

export function ManageArbitrators() {
  const { address } = useAccount()

  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('add')
  const [showSuccess, setShowSuccess] = useState(false)

  const contract = {
    address: OUTCOME_EXCHANGE_ADDRESS,
    abi: outcomeExchangeAbi,
  } as const

  const { data: owner } = useReadContract({
    ...contract,
    functionName: 'owner',
  })
  const isOwner = Boolean(address) && owner?.toLowerCase() === address?.toLowerCase()

  // Any active arbitration blocks add/remove (contract reverts).
  const { data: activeArbitrations } = useReadContract({
    ...contract,
    functionName: 'activeArbitrations',
  })
  const arbitrationInProgress = (activeArbitrations as bigint | undefined) ?? 0n
  const blockedByArbitration = arbitrationInProgress > 0n

  // Read the current panel by probing indices 0..MAX-1 (no length getter exists).
  const { data: rosterReads, refetch: refetchRoster } = useReadContracts({
    allowFailure: true,
    contracts: Array.from({ length: MAX_ARBITRATORS }, (_, i) => ({
      ...contract,
      functionName: 'arbitratorList' as const,
      args: [BigInt(i)] as const,
    })),
    query: { enabled: Boolean(OUTCOME_EXCHANGE_ADDRESS) },
  })

  const roster = useMemo<Address[]>(() => {
    if (!rosterReads) return []
    return rosterReads
      .filter((r) => r.status === 'success' && r.result)
      .map((r) => r.result as Address)
  }, [rosterReads])

  const target = useMemo<Address | undefined>(() => {
    if (!isAddress(input)) return undefined
    return getAddress(input)
  }, [input])

  const { data: targetIsArbitrator, refetch: refetchStatus } = useReadContract({
    ...contract,
    functionName: 'isArbitrator',
    args: target ? [target] : undefined,
    query: { enabled: Boolean(target) },
  })

  // Contract-enforced constraints, surfaced before the user submits.
  const atMax = roster.length >= MAX_ARBITRATORS
  const atFloor = roster.length <= ARBITRATION_THRESHOLD

  const noOp =
    (mode === 'add' && targetIsArbitrator === true) ||
    (mode === 'remove' && targetIsArbitrator === false)

  const constraintBlock =
    blockedByArbitration ||
    (mode === 'add' && atMax) ||
    (mode === 'remove' && atFloor)

  const canSubmit = isOwner && Boolean(target) && !noOp && !constraintBlock

  const { data: simulation, error: simulationError } = useSimulateContract({
    ...contract,
    functionName: mode === 'add' ? 'addArbitrator' : 'removeArbitrator',
    args: target ? [target] : undefined,
    query: { enabled: canSubmit },
  })

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()

  const { isLoading: confirming, isSuccess, error: receiptError } =
    useWaitForTransactionReceipt({ hash })

  function submit() {
    if (!simulation?.request) return
    writeContract(simulation.request)
  }

  useEffect(() => {
    if (!isSuccess) return
    setShowSuccess(true)
    void refetchStatus()
    void refetchRoster()
    const timer = setTimeout(() => {
      setInput('')
      setShowSuccess(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [isSuccess, refetchStatus, refetchRoster])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-6 rounded-lg border border-[#2a2a35] bg-[#101017] p-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Manage Arbitrators</h2>
          <p className="mt-2 font-sans text-sm text-[#7c7a76]">
            Arbitrators resolve disputed Outcome Exchange wagers. The panel holds{' '}
            {ARBITRATION_THRESHOLD}–{MAX_ARBITRATORS} members; {ARBITRATION_THRESHOLD} matching
            votes resolve a dispute. Only the contract owner can change the panel.
          </p>
        </div>

        {/* Current panel */}
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-sans text-sm font-semibold text-[#e8e6e3]">Current panel</p>
            <span className="font-sans text-xs text-[#7c7a76]">
              {roster.length} / {MAX_ARBITRATORS}
            </span>
          </div>
          {roster.length === 0 ? (
            <p className="font-sans text-xs text-[#7c7a76]">No arbitrators found.</p>
          ) : (
            <ul className="space-y-1">
              {roster.map((a) => (
                <li key={a} className="font-mono text-xs text-[#b8b6b1]">
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {(['add', 'remove'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full border px-4 py-2 font-sans text-sm font-medium transition-all ${
                mode === m
                  ? 'border-[#d8b13d] bg-[#d8b13d]/10 text-[#d8b13d]'
                  : 'border-[#2a2a35] text-[#9a9a9a] hover:border-[#3a3a45] hover:text-[#b8b6b1]'
              }`}
            >
              {m === 'add' ? 'Add Arbitrator' : 'Remove Arbitrator'}
            </button>
          ))}
        </div>

        {/* Address input */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
            Wallet Address
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] placeholder-[#7c7a76] focus:border-[#d4af37] focus:outline-none"
          />
          {input.length > 0 && !target && (
            <p className="mt-2 font-sans text-xs text-red-400">Not a valid address.</p>
          )}
          {target && targetIsArbitrator !== undefined && (
            <p className="mt-2 font-sans text-xs text-[#7c7a76]">
              Current status:{' '}
              <span className={targetIsArbitrator ? 'text-green-400' : 'text-[#9a9a9a]'}>
                {targetIsArbitrator ? 'Arbitrator' : 'Not an arbitrator'}
              </span>
            </p>
          )}
        </div>

        {/* Constraint / no-op notices */}
        {blockedByArbitration && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="font-sans text-sm text-orange-400">
              An arbitration is currently in progress. The panel can only be changed once no
              arbitrations are active.
            </p>
          </div>
        )}
        {!blockedByArbitration && mode === 'add' && atMax && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="font-sans text-sm text-orange-400">
              The panel is already at the maximum of {MAX_ARBITRATORS} arbitrators.
            </p>
          </div>
        )}
        {!blockedByArbitration && mode === 'remove' && atFloor && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="font-sans text-sm text-orange-400">
              The panel cannot drop below the threshold of {ARBITRATION_THRESHOLD} arbitrators.
            </p>
          </div>
        )}
        {target && mode === 'add' && targetIsArbitrator === true && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="font-sans text-sm text-orange-400">
              This address is already an arbitrator.
            </p>
          </div>
        )}
        {target && mode === 'remove' && targetIsArbitrator === false && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="font-sans text-sm text-orange-400">
              This address is not currently an arbitrator.
            </p>
          </div>
        )}

        {!isOwner && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="font-sans text-sm text-red-400">
              Only the contract owner can manage arbitrators.
            </p>
          </div>
        )}

        {simulationError && canSubmit && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="font-sans text-sm text-red-400">{simulationError.message}</p>
          </div>
        )}
        {writeError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="font-sans text-sm text-red-400">{writeError.message}</p>
          </div>
        )}
        {receiptError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="font-sans text-sm text-red-400">{receiptError.message}</p>
          </div>
        )}
        {showSuccess && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <p className="font-sans text-sm text-green-400">
              ✓ {mode === 'add' ? 'Arbitrator added.' : 'Arbitrator removed.'}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || !simulation?.request || isPending || confirming}
          className="w-full rounded-lg border border-[#d4af37] bg-[#d4af37]/10 px-4 py-3 font-sans font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? 'Confirm in Wallet'
            : confirming
              ? 'Processing...'
              : mode === 'add'
                ? 'Add Arbitrator'
                : 'Remove Arbitrator'}
        </button>
      </div>
    </div>
  )
}