'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { isAddress, getAddress } from 'viem'
import type { Address } from 'viem'
import { predictionMarketAbi } from '@/lib/abis/prediction-market'

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ('0x3CE1D7142259237519Ed41D6b4d95690457427C6' as Address)

type Mode = 'add' | 'remove'

export function ManageAdmins() {
  const { address } = useAccount()

  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('add')
  const [showSuccess, setShowSuccess] = useState(false)

  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const

  // Owner gate — this component is only rendered for the owner, but we re-check
  // here so the write buttons never enable for a non-owner.
  const { data: owner } = useReadContract({
    ...contract,
    functionName: 'owner',
  })
  const isOwner = Boolean(address) && owner?.toLowerCase() === address?.toLowerCase()

  const target = useMemo<Address | undefined>(() => {
    if (!isAddress(input)) return undefined
    return getAddress(input)
  }, [input])

  // Live status of the typed address.
  const { data: targetIsAdmin, refetch: refetchStatus } = useReadContract({
    ...contract,
    functionName: 'isAdmin',
    args: target ? [target] : undefined,
    query: { enabled: Boolean(target) },
  })

  // Guard against no-op transactions the contract would revert:
  //   add → already admin; remove → not an admin.
  const wouldRevert =
    (mode === 'add' && targetIsAdmin === true) ||
    (mode === 'remove' && targetIsAdmin === false)

  const canSubmit = isOwner && Boolean(target) && !wouldRevert

  const { data: simulation, error: simulationError } = useSimulateContract({
    ...contract,
    functionName: mode === 'add' ? 'addAdmin' : 'removeAdmin',
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
    const timer = setTimeout(() => {
      setInput('')
      setShowSuccess(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [isSuccess, refetchStatus])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-6 rounded-lg border border-[#2a2a35] bg-[#101017] p-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Manage Admins</h2>
          <p className="mt-2 font-sans text-sm text-[#7c7a76]">
            Admins can create Probability Shop markets. Only the contract owner can add or
            remove admins.
          </p>
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
              {m === 'add' ? 'Add Admin' : 'Remove Admin'}
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
          {target && targetIsAdmin !== undefined && (
            <p className="mt-2 font-sans text-xs text-[#7c7a76]">
              Current status:{' '}
              <span className={targetIsAdmin ? 'text-green-400' : 'text-[#9a9a9a]'}>
                {targetIsAdmin ? 'Admin' : 'Not an admin'}
              </span>
            </p>
          )}
        </div>

        {/* No-op guard notices */}
        {target && mode === 'add' && targetIsAdmin === true && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="font-sans text-sm text-orange-400">
              This address is already an admin.
            </p>
          </div>
        )}
        {target && mode === 'remove' && targetIsAdmin === false && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="font-sans text-sm text-orange-400">
              This address is not currently an admin.
            </p>
          </div>
        )}

        {!isOwner && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="font-sans text-sm text-red-400">
              Only the contract owner can manage admins.
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
              ✓ {mode === 'add' ? 'Admin added.' : 'Admin removed.'}
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
                ? 'Add Admin'
                : 'Remove Admin'}
        </button>
      </div>
    </div>
  )
}