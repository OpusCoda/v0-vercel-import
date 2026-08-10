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
  ('0x77b004A0029d725e353E5EE0D80102516A4e52a8' as Address)

export function ManageResolver() {
  const { address } = useAccount()

  const [input, setInput] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const contract = {
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
  } as const

  const { data: owner } = useReadContract({ ...contract, functionName: 'owner' })
  const isOwner = Boolean(address) && owner?.toLowerCase() === address?.toLowerCase()

  const { data: currentResolver, refetch } = useReadContract({
    ...contract,
    functionName: 'resolver',
  })

  const target = useMemo<Address | undefined>(() => {
    if (!isAddress(input)) return undefined
    return getAddress(input)
  }, [input])

  const isSameAsCurrent =
    Boolean(target) && currentResolver?.toLowerCase() === target?.toLowerCase()

  const canSubmit = isOwner && Boolean(target) && !isSameAsCurrent

  const { data: simulation, error: simulationError } = useSimulateContract({
    ...contract,
    functionName: 'setResolver',
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
    void refetch()
    const timer = setTimeout(() => {
      setInput('')
      setShowSuccess(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [isSuccess, refetch])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-6 rounded-lg border border-[#2a2a35] bg-[#101017] p-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#B87333]">Manage Resolver</h2>
          <p className="mt-2 font-sans text-sm text-[#7c7a76]">
            The resolver settles disputed markets. Only the contract owner can change it.
          </p>
        </div>

        {/* Current resolver */}
        <div className="rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-4">
          <p className="font-sans text-xs font-semibold text-[#e8e6e3]">Current resolver</p>
          <p className="mt-1 break-all font-mono text-xs text-[#b8b6b1]">
            {currentResolver ? (currentResolver as string) : 'Loading…'}
          </p>
        </div>

        {/* New resolver */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
            New Resolver Address
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] placeholder-[#7c7a76] focus:border-[#B87333] focus:outline-none"
          />
          {input.length > 0 && !target && (
            <p className="mt-2 font-sans text-xs text-red-400">Not a valid address.</p>
          )}
          {isSameAsCurrent && (
            <p className="mt-2 font-sans text-xs text-orange-400">
              This is already the current resolver.
            </p>
          )}
        </div>

        {!isOwner && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="font-sans text-sm text-red-400">
              Only the contract owner can change the resolver.
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
            <p className="font-sans text-sm text-green-400">✓ Resolver updated.</p>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || !simulation?.request || isPending || confirming}
          className="w-full rounded-lg border border-[#B87333] bg-[#B87333]/10 px-4 py-3 font-sans font-semibold text-[#B87333] transition-colors hover:bg-[#B87333]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Confirm in Wallet' : confirming ? 'Processing...' : 'Set Resolver'}
        </button>
      </div>
    </div>
  )
}