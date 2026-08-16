'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, isAddress } from 'viem'
import {
  WAGER_MARKET_ADDRESS,
  WAGER_MARKET_ABI,
  CATEGORIES,
  DEPOSIT_WINDOWS,
} from '@/lib/wager-market'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

// Seconds for each DepositWindow enum index: H24, H48, W1, M1
const WINDOW_SECONDS = [24 * 3600, 48 * 3600, 7 * 86400, 30 * 86400]

// Minimum stake per side (frontend-only guard; the contract has no minimum).
const MIN_STAKE_PLS = 100_000

// The user's IANA timezone name (e.g. "Europe/Oslo"), for labelling local time.
const LOCAL_TZ =
  (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'local'

// "Tue, 04 Aug 2026, 10:10" in the user's local timezone.
function localLabel(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "Tue, 04 Aug 2026 08:10 UTC" — toUTCString() minus the trailing " GMT",
// with an explicit "UTC" tag (UTC and GMT are the same instant; show one label).
function utcLabel(d: Date): string {
  return d.toUTCString().replace(' GMT', '') + ' UTC'
}

// Display helper: group integer part with thousands separators for the stake
// fields. Input state stays a raw dot-decimal string; this only affects display.
function groupThousands(raw: string): string {
  if (raw === '') return ''
  const [intPart, decPart] = raw.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped
}

// Format a "YYYY-MM-DDTHH:mm" local datetime-local string a few days out.
function defaultEventDateTime(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(12, 0, 0, 0)
  // Build a local-time string (not ISO/UTC) for the datetime-local input.
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CreateWager() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending, data: txHash, error: writeError, reset: resetWrite } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  const dateInputRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState('')
  const [eventDateTime, setEventDateTime] = useState('') // "YYYY-MM-DDTHH:mm" local time
  const [depositWindow, setDepositWindow] = useState('0') // enum index
  const [myStake, setMyStake] = useState('')
  const [challengerStake, setChallengerStake] = useState('')
  const [challengerAddress, setChallengerAddress] = useState('')
  const [category, setCategory] = useState('0') // enum index
  const [creatorBacks, setCreatorBacks] = useState<'yes' | 'no'>('yes')

  const [referrer, setReferrer] = useState('')

  // Pull the referrer captured from a ?ref= link (stored by the referral page).
  // Not a visible field — bound on-chain on the user's first wager.
  useEffect(() => {
    try {
      const pending = localStorage.getItem('opus_pending_referrer')
      if (pending) setReferrer(pending)
    } catch { }
  }, [])

  const [showConfirm, setShowConfirm] = useState(false)
  const [showOddsHelp, setShowOddsHelp] = useState(false)
  const [effectiveFeePercent, setEffectiveFeePercent] = useState<number>(0)

  // Initialize eventDateTime to a few days out so the smallest window fits.
  useEffect(() => {
    setEventDateTime(defaultEventDateTime(3))
  }, [])

  // Fetch fee info — getUserFeeInfo returns 4 flat values:
  // [baseFeeBps, stakingRebate, referralRebate, effectiveFeeBps]
  const { data: feeInfoData } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'getUserFeeInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 60000 },
  })

  useEffect(() => {
    if (feeInfoData) {
      const [, , , effectiveFeeBps] = feeInfoData as readonly bigint[]
      setEffectiveFeePercent(Number(effectiveFeeBps) / 100) // BPS -> percent
    }
  }, [feeInfoData])

  // --- Live event-time validity (mirrors the contract's two requires) ---
  const windowSeconds = WINDOW_SECONDS[Number(depositWindow)]
  const eventTs = eventDateTime ? Math.floor(new Date(eventDateTime).getTime() / 1000) : 0
  const nowTs = Math.floor(Date.now() / 1000)
  const isEventDateValid = eventTs > nowTs + windowSeconds

  // Date objects for local + UTC labelling.
  const eventDateObj = eventDateTime ? new Date(eventDateTime) : null
  const earliestValidDate = new Date((nowTs + windowSeconds) * 1000)
  // Earliest valid moment = now + window, shown in UTC (matches the contract rule).
  const earliestValidLabel = utcLabel(earliestValidDate)
  const eventLocalLabel = eventDateObj ? localLabel(eventDateObj) : ''
  const eventUtcLabel = eventDateObj ? utcLabel(eventDateObj) : ''

  // Stake minimums (both sides must meet the floor).
  const myStakeBelowMin = !!myStake && parseFloat(myStake) < MIN_STAKE_PLS
  const challengerStakeBelowMin = !!challengerStake && parseFloat(challengerStake) < MIN_STAKE_PLS

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !address) {
      alert('Please connect your wallet')
      return
    }

    const requiredFields = [description, eventDateTime, depositWindow, myStake, challengerStake, category]
    if (requiredFields.some(f => !f)) {
      alert('Please fill in all required fields')
      return
    }
    if (!isEventDateValid) {
      alert(`Event date is too soon for the selected deposit window. Earliest valid: ${earliestValidLabel}`)
      return
    }
    if (parseFloat(myStake) < MIN_STAKE_PLS || parseFloat(challengerStake) < MIN_STAKE_PLS) {
      alert(`Minimum stake is ${MIN_STAKE_PLS.toLocaleString()} PLS on each side.`)
      return
    }

    resetWrite() // clear any prior success/error banner
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    if (!isConnected || !address) return

    // Validate optional challenger address
    const resolvedChallenger = challengerAddress === '' ? ZERO_ADDRESS : challengerAddress
    if (challengerAddress !== '' && !isAddress(challengerAddress)) {
      alert('Challenger address is not a valid wallet address')
      return
    }

    // Referrer comes from localStorage (?ref= capture), not user input.
    // If it's missing or malformed, just fall back to zero — don't block the user.
    const resolvedReferrer =
      referrer !== '' && isAddress(referrer) ? referrer : ZERO_ADDRESS

    try {
      // datetime-local is local time; new Date() parses it unambiguously to a UTC instant.
      const eventTimestamp = Math.floor(new Date(eventDateTime).getTime() / 1000)
      // uint8 enums -> plain numbers, not BigInt. Declared before use in the guard.
      const depositWindowEnum = parseInt(depositWindow, 10)
      const categoryEnum = parseInt(category, 10)

      // Final safety guard (mirrors contract requires) before spending gas.
      const now = Math.floor(Date.now() / 1000)
      if (eventTimestamp <= now) {
        alert('Event date must be in the future')
        return
      }
      if (now + WINDOW_SECONDS[depositWindowEnum] >= eventTimestamp) {
        alert('Event date is too soon for this deposit window — pick a later date/time')
        return
      }

      const stake = parseEther(myStake)
      const challengerStakeWei = parseEther(challengerStake)

      // creatorStake is derived on-chain from msg.value:
      //   voteDeposit  = msg.value * 500 / 10500
      //   creatorStake = msg.value - voteDeposit
      // So sending stake + 5% makes creatorStake == stake.
      const msgValue = stake + (stake * BigInt(500)) / BigInt(10000)
      const stanceTag = creatorBacks === 'yes'
        ? ' — Creator backs YES (this happens)'
        : " — Creator backs NO (this won't happen)"
      const fullDescription = description + stanceTag
      writeContract({
        address: WAGER_MARKET_ADDRESS,
        abi: WAGER_MARKET_ABI,
        functionName: 'createWager',
        args: [
          resolvedChallenger as `0x${string}`,
          fullDescription,
          BigInt(eventTimestamp),
          depositWindowEnum,
          challengerStakeWei,
          categoryEnum,
          resolvedReferrer as `0x${string}`,
        ],
        value: msgValue,
      })

      // Close the confirm modal — the status banner on the form now drives feedback.
      setShowConfirm(false)
    } catch (error) {
      console.error('[v0] Error creating wager:', error)
    }
  }

  // On confirmation, reset the form (keep referrer — bound once on-chain).
  useEffect(() => {
    if (isConfirmed) {
      setDescription('')
      setEventDateTime(defaultEventDateTime(3))
      setDepositWindow('0')
      setMyStake('')
      setChallengerStake('')
      setChallengerAddress('')
      setCategory('0')
    }
  }, [isConfirmed])

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111116] p-8 text-center">
        <p className="text-[#9a9a9a]">Connect your wallet to create a wager</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-[#111116] p-8 mb-8">
        <h2 className="font-serif text-2xl font-bold mb-6">Create P2P Wager</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this wager about?"
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:border-[#B87333] focus:outline-none"
              required
            />
            <div className="mt-2 rounded-lg border border-[#B87333]/30 bg-[#B87333]/5 px-3 py-2.5 text-xs leading-relaxed text-[#b8b6b1]">
              <p className="mt-1.5">
                If you mention a date/time in the description, make sure it matches the Event Date &amp; Time set below. If they differ, the{' '}
                <span className="font-semibold text-[#f4f4f4]">Event Date &amp; Time (UTC)</span> is what settles the wager.
              </p>
            </div>
          </div>

          {/* Which side the creator backs */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Your position</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreatorBacks('yes')}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  creatorBacks === 'yes'
                    ? 'border-green-400/50 bg-green-400/10 text-green-400'
                    : 'border-white/10 bg-[#09090B] text-[#9a9a9a] hover:border-white/20'
                }`}
              >
                Backs YES — that this happens
              </button>
              <button
                type="button"
                onClick={() => setCreatorBacks('no')}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  creatorBacks === 'no'
                    ? 'border-red-400/50 bg-red-400/10 text-red-400'
                    : 'border-white/10 bg-[#09090B] text-[#9a9a9a] hover:border-white/20'
                }`}
              >
                Backs NO — that this won't happen
              </button>
            </div>
          </div>

          {/* My Stake */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">My Stake (PLS)</label>
            <input
              type="text"
              inputMode="decimal"
              value={groupThousands(myStake)}
              onChange={(e) => {
                // Strip grouping commas, then keep only a valid decimal string.
                const raw = e.target.value.replace(/,/g, '')
                if (raw === '' || /^\d*\.?\d*$/.test(raw)) setMyStake(raw)
              }}
              placeholder="0"
              className={`w-full rounded-lg border bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:outline-none ${myStakeBelowMin
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-white/10 focus:border-[#B87333]'
                }`}
              required
            />
            {myStakeBelowMin && (
              <p className="text-xs text-red-400 mt-1">Minimum {MIN_STAKE_PLS.toLocaleString()} PLS.</p>
            )}
          </div>

          {/* Event Date & Time. Local + UTC shown explicitly. */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">
              Event Date &amp; Time <span className="text-[#9a9a9a] font-normal">(enter in your local time)</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={dateInputRef}
                type="datetime-local"
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] focus:border-[#B87333] focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#9a9a9a] hover:border-[#B87333] hover:text-[#B87333] transition"
                title="Open calendar"
              >
                📅
              </button>
            </div>
            {eventDateTime && (
              <div className="text-xs mt-2 leading-relaxed space-y-0.5">
                <div className="text-[#9a9a9a]">
                  <span className="text-[#666]">Your time ({LOCAL_TZ}):</span> {eventLocalLabel}
                </div>
                <div className="text-[#9a9a9a]">
                  <span className="text-[#666]">UTC:</span> {eventUtcLabel}
                </div>
                {!isEventDateValid && (
                  <div className="block text-red-400 mt-1">
                    Too soon for a {DEPOSIT_WINDOWS[Number(depositWindow)].label} deposit window.
                    Earliest valid: {earliestValidLabel}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deposit Window */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Deposit Window</label>
            <select
              value={depositWindow}
              onChange={(e) => setDepositWindow(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] focus:border-[#B87333] focus:outline-none"
            >
              {DEPOSIT_WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#9a9a9a] mt-1">
              How long the challenger has to accept. The event date must be later than this window.
            </p>
          </div>

          {/* Challenger Stake */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Challenger Stake (PLS)</label>
            <input
              type="text"
              inputMode="decimal"
              value={groupThousands(challengerStake)}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '')
                if (raw === '' || /^\d*\.?\d*$/.test(raw)) setChallengerStake(raw)
              }}
              placeholder="0"
              className={`w-full rounded-lg border bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:outline-none ${challengerStakeBelowMin
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-white/10 focus:border-[#B87333]'
                }`}
              required
            />
            {challengerStakeBelowMin && (
              <p className="text-xs text-red-400 mt-1">Minimum {MIN_STAKE_PLS.toLocaleString()} PLS.</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] focus:border-[#B87333] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Challenger Address (optional) */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Challenger Address (Optional)</label>
            <input
              type="text"
              value={challengerAddress}
              onChange={(e) => setChallengerAddress(e.target.value)}
              placeholder="0x0000... (leave empty for open wager)"
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:border-[#B87333] focus:outline-none"
            />
          </div>

          {/* Fee & Odds Info */}
          <div className="space-y-3">
            {parseFloat(myStake) > 0 && parseFloat(challengerStake) > 0 && (
              <div className="rounded-lg border border-white/20 bg-[#09090B] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-[#9a9a9a]">If your wager is accepted and you win</div>
                  <button
                    type="button"
                    onClick={() => setShowOddsHelp((v) => !v)}
                    className="text-xs text-[#9a9a9a] hover:text-[#B87333] transition underline decoration-dotted"
                  >
                    How is this calculated?
                  </button>
                </div>
                {(() => {
                  const myStakeNum = parseFloat(myStake)
                  const challengerStakeNum = parseFloat(challengerStake)
                  const pot = myStakeNum + challengerStakeNum
                  const estFee = pot * 0.005 // base 0.5% estimate
                  const totalBack = pot - estFee
                  const netProfit = totalBack - myStakeNum
                  return (
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-[#B87333]">
                        {totalBack.toLocaleString(undefined, { maximumFractionDigits: 0 })} PLS back
                      </div>
                      <div className="text-xs text-[#9a9a9a]">
                        (+{netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} profit, estimated)
                      </div>
                      {showOddsHelp && (
                        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-[#9a9a9a] leading-relaxed">
                          The winner takes the whole pot — your stake ({myStakeNum.toLocaleString()} PLS)
                          plus the challenger's ({challengerStakeNum.toLocaleString()} PLS) —
                          minus a protocol fee. This estimate uses the base 0.5% fee; your actual fee
                          may be lower with a staking or referral discount, and is deducted at resolution.
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="rounded-lg border border-white/20 bg-[#09090B] p-4">
              <div className="text-sm text-[#9a9a9a] mb-3">Transaction Details</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9a9a9a]">Your Stake:</span>
                  <span className="text-[#f4f4f4]">{parseFloat(myStake || '0').toLocaleString()} PLS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9a9a9a]">Vote Deposit (5%):</span>
                  <span className="text-[#f4f4f4]">{(parseFloat(myStake || '0') * 0.05).toFixed(2)} PLS</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#B87333]">Total to Send:</span>
                    <span className="text-[#B87333]">{(parseFloat(myStake || '0') * 1.05).toFixed(2)} PLS</span>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-white/10">
                  <div className="flex justify-between text-[#9a9a9a]">
                    <span>Your Fee ({effectiveFeePercent.toFixed(2)}%):</span>
                    <span className="text-xs">Deducted at resolution</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction status */}
          {(isConfirming || isConfirmed || writeError) && (
            <div
              className={`rounded-lg border p-4 text-sm ${isConfirmed
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : writeError
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-[#B87333]/30 bg-[#B87333]/10 text-[#B87333]'
                }`}
            >
              {isConfirmed ? (
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Wager successfully created — your wager is now collateralized on-chain.</span>
                </div>
              ) : writeError ? (
                <div>
                  {writeError.message.includes('User rejected') || writeError.message.includes('denied')
                    ? 'Transaction rejected in wallet.'
                    : 'Transaction failed — see your wallet for details.'}
                </div>
              ) : (
                <div className="space-y-1">
                  <div>Your wager will be collateralized as soon as the blockchain concurs.</div>
                  <div className="text-xs opacity-80">Waiting for confirmation...</div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isPending || isConfirming || !isEventDateValid ||
              parseFloat(myStake || '0') < MIN_STAKE_PLS ||
              parseFloat(challengerStake || '0') < MIN_STAKE_PLS
            }
            className="w-full rounded-lg bg-[#B87333] px-6 py-3 font-semibold text-black transition hover:bg-[#B87333]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? 'Confirm in wallet...'
              : isConfirming
                ? 'Collateralizing...'
                : !isEventDateValid
                  ? 'Pick a later event date'
                  : (parseFloat(myStake || '0') < MIN_STAKE_PLS || parseFloat(challengerStake || '0') < MIN_STAKE_PLS)
                    ? `Minimum ${MIN_STAKE_PLS.toLocaleString()} PLS per side`
                    : 'Review & Create Wager'}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-white/10 bg-[#111116] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-8">
              <h3 className="font-serif text-xl font-bold text-[#e8e6e3] mb-1">
                {CATEGORIES.find(c => c.value.toString() === category)?.label}
              </h3>
              <p className="text-[#9a9a9a] text-sm">"{description}"</p>
              <div className="mt-2 text-xs text-[#9a9a9a] space-y-0.5">
                <div><span className="text-[#666]">Your time ({LOCAL_TZ}):</span> {eventLocalLabel}</div>
                <div><span className="text-[#666]">UTC:</span> {eventUtcLabel}</div>
              </div>
            </div>
            <div className="space-y-6 text-sm font-mono">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#9a9a9a]">Your Stake:</span>
                  <span className="text-[#f4f4f4]">{parseFloat(myStake || '0').toLocaleString()} PLS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9a9a9a]">Challenger Stake:</span>
                  <span className="text-[#f4f4f4]">{parseFloat(challengerStake || '0').toLocaleString()} PLS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9a9a9a]">If you win:</span>
                  <span className="text-[#B87333] font-semibold">+{parseFloat(challengerStake || '0').toLocaleString()} PLS</span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-[#B87333] font-bold">Total to Send Now:</span>
                  <span className="text-[#B87333] font-bold">
                    {(parseFloat(myStake || '0') * 1.05).toFixed(0)} PLS
                  </span>
                </div>
                <div className="text-xs text-[#9a9a9a] leading-relaxed">
                  (includes a {(parseFloat(myStake || '0') * 0.05).toFixed(0)} vote deposit which will be returned if you submit a vote for the correct outcome at the resolution of the bet.)
                  <br />
                  Fee of {effectiveFeePercent.toFixed(2)}%, deducted at resolution.
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-white/10 px-4 py-3 font-semibold text-[#f4f4f4] hover:border-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-lg bg-[#B87333] px-4 py-3 font-semibold text-black hover:bg-[#B87333]/90 disabled:opacity-50 transition"
              >
                {isPending ? 'Creating...' : 'Confirm & Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}