'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { parseEther, formatEther } from 'viem'
import type { Address } from 'viem'
import { predictionMarketAbi } from '@/lib/abis/prediction-market'

const PREDICTION_MARKET_ADDRESS =
  (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address) ||
  ('0x9F33330BA35cF5f34bB772E4c7a6Fc70D7c1a1BE' as Address)

const CATEGORIES = [
  'Crypto',
  'PulseChain',
  'Politics',
  'Sports',
  'Macro',
  'Misc',
] as const

type Category = (typeof CATEGORIES)[number]

const CATEGORY_INDEX: Record<Category, number> = {
  Crypto: 0,
  PulseChain: 1,
  Politics: 2,
  Sports: 3,
  Macro: 4,
  Misc: 5,
}

// Fallback minimum used only until the on-chain value loads.
const FALLBACK_MIN_PER_SIDE = parseEther('500')

function toUnixSeconds(value: string): bigint | undefined {
  if (!value) return undefined
  const milliseconds = new Date(value).getTime()
  if (!Number.isFinite(milliseconds)) return undefined
  return BigInt(Math.floor(milliseconds / 1000))
}

export function CreateMarketForm() {
  const { address } = useAccount()

  const [question, setQuestion] = useState('')
  const [resolutionCriteria, setResolutionCriteria] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState<Category>('Crypto')
  const [bettingDeadlineInput, setBettingDeadlineInput] = useState('')
  const [resolutionDeadlineInput, setResolutionDeadlineInput] = useState('')
  const [seedPerSideInput, setSeedPerSideInput] = useState('500')
  const [showSuccess, setShowSuccess] = useState(false)

  const bettingDeadline = useMemo(
    () => toUnixSeconds(bettingDeadlineInput),
    [bettingDeadlineInput],
  )

  const resolutionDeadline = useMemo(
    () => toUnixSeconds(resolutionDeadlineInput),
    [resolutionDeadlineInput],
  )

  const seedPerSide = useMemo(() => {
    try {
      return parseEther(seedPerSideInput || '0')
    } catch {
      return undefined
    }
  }, [seedPerSideInput])

  // Minimum liquidity per side. Hardcoded — this is an admin-only form and the
  // value rarely changes; no need to read it from the contract.
  const minPerSide = FALLBACK_MIN_PER_SIDE
  // Whole-token string for the input's min attribute and helper text.
  const minPerSideDisplay = useMemo(() => {
    try {
      return formatEther(minPerSide)
    } catch {
      return '500'
    }
  }, [minPerSide])

  const { data: owner } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: 'owner',
  })

  const { data: isAdmin } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: 'isAdmin',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  })

  const authorized =
    Boolean(address) &&
    (owner?.toLowerCase() === address?.toLowerCase() || isAdmin === true)

  const validForm =
    authorized &&
    question.trim().length > 0 &&
    bettingDeadline !== undefined &&
    resolutionDeadline !== undefined &&
    resolutionDeadline > bettingDeadline &&
    seedPerSide !== undefined &&
    seedPerSide >= minPerSide

  const args =
    validForm &&
    bettingDeadline !== undefined &&
    resolutionDeadline !== undefined &&
    seedPerSide !== undefined
      ? ([
          question.trim(),
          resolutionCriteria.trim(),
          source.trim(),
          CATEGORY_INDEX[category],
          bettingDeadline,
          resolutionDeadline,
          seedPerSide,
        ] as const)
      : undefined

  const { data: simulation, error: simulationError } = useSimulateContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: 'createMarket',
    args,
    value: seedPerSide !== undefined ? seedPerSide * 2n : undefined,
    query: {
      enabled: Boolean(args && seedPerSide),
    },
  })

  const {
    data: hash,
    writeContract,
    isPending: walletPending,
    error: writeError,
  } = useWriteContract()

  const {
    isLoading: confirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  function createMarket() {
    if (!simulation?.request) return
    writeContract(simulation.request)
  }

  // Reset the form after a confirmed success. Runs as an effect (not during
  // render) so it can't trigger the "update during render" error or a loop.
  useEffect(() => {
    if (!isSuccess) return
    setShowSuccess(true)
    const timer = setTimeout(() => {
      setQuestion('')
      setResolutionCriteria('')
      setSource('')
      setCategory('Crypto')
      setBettingDeadlineInput('')
      setResolutionDeadlineInput('')
      setSeedPerSideInput(minPerSideDisplay)
      setShowSuccess(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [isSuccess, minPerSideDisplay])

  const totalCost = seedPerSide ? (Number(seedPerSideInput || 0) * 2).toFixed(0) : '0'

  return (
    <div className="mx-auto max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          createMarket()
        }}
        className="space-y-6 rounded-lg border border-[#2a2a35] bg-[#101017] p-8"
      >
        <h2 className="font-serif text-2xl font-bold text-[#d4af37]">Create YES/NO Market</h2>

        {/* Question */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
            Market Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Will BTC trade above $150,000 before 1 January 2027?"
            className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] placeholder-[#7c7a76] focus:border-[#d4af37] focus:outline-none"
          />
        </div>

        {/* Resolution Criteria */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
            Resolution Criteria
          </label>
          <textarea
            value={resolutionCriteria}
            onChange={(e) => setResolutionCriteria(e.target.value)}
            placeholder="Define the exact conditions under which YES resolves."
            rows={3}
            className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] placeholder-[#7c7a76] focus:border-[#d4af37] focus:outline-none"
          />
        </div>

        {/* Resolution Source */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
            Resolution Source
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., CoinGecko BTC/USD"
            className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] placeholder-[#7c7a76] focus:border-[#d4af37] focus:outline-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] focus:border-[#d4af37] focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Betting Deadline */}
          <div>
            <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
              Betting Closes
            </label>
            <input
              type="datetime-local"
              value={bettingDeadlineInput}
              onChange={(e) => setBettingDeadlineInput(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {/* Resolution Deadline */}
          <div>
            <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
              Resolution Opens
            </label>
            <input
              type="datetime-local"
              value={resolutionDeadlineInput}
              onChange={(e) => setResolutionDeadlineInput(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] focus:border-[#d4af37] focus:outline-none"
            />
          </div>
        </div>

        {/* Initial Liquidity */}
        <div>
          <label className="block font-sans text-sm font-semibold text-[#e8e6e3] mb-2">
            Initial Liquidity per Side
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={seedPerSideInput}
              onChange={(e) => setSeedPerSideInput(e.target.value)}
              min={minPerSideDisplay}
              step="100"
              className="flex-1 rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 font-sans text-sm text-[#e8e6e3] placeholder-[#7c7a76] focus:border-[#d4af37] focus:outline-none"
            />
            <span className="font-sans text-sm text-[#7c7a76]">PLS</span>
          </div>
          <p className="mt-2 font-sans text-sm text-[#7c7a76]">
            Minimum per side: <span className="font-semibold text-[#d4af37]">{minPerSideDisplay} PLS</span>
            {' · '}
            Total required: <span className="font-semibold text-[#d4af37]">{totalCost} PLS</span>
          </p>
        </div>

        {/* Authorization status */}
        {authorized && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <p className="font-sans text-sm text-green-400">
              ✓ This wallet is authorized to create markets.
            </p>
          </div>
        )}

        {/* Errors */}
        {!authorized && address && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="font-sans text-sm text-red-400">
              This wallet is not authorized to create markets.
            </p>
          </div>
        )}

        {simulationError && (
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

        {!address && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="font-sans text-sm text-orange-400">
              Please connect your wallet to create a market.
            </p>
          </div>
        )}

        {/* Success */}
        {showSuccess && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <p className="font-sans text-sm text-green-400">✓ Market created successfully!</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            !validForm ||
            !simulation?.request ||
            walletPending ||
            confirming ||
            !address
          }
          className="w-full rounded-lg border border-[#d4af37] bg-[#d4af37]/10 px-4 py-3 font-sans font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!address
            ? 'Connect Wallet'
            : walletPending
              ? 'Confirm in Wallet'
              : confirming
                ? 'Creating Market...'
                : 'Create YES/NO Market'}
        </button>
      </form>
    </div>
  )
}