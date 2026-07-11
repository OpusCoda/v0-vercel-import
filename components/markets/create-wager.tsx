'use client'
import { useState, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseEther, isAddress } from 'viem'
import {
  WAGER_MARKET_ADDRESS,
  WAGER_MARKET_ABI,
  CATEGORIES,
  DEPOSIT_WINDOWS,
  PRICE_BET_TOKENS,
} from '@/lib/wager-market'
type WagerType = 'standard' | 'price-bet'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
// Seconds for each DepositWindow enum index: H24, H48, W1, M1
const WINDOW_SECONDS = [24 * 3600, 48 * 3600, 7 * 86400, 30 * 86400]
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
  const { writeContract, isPending } = useWriteContract()
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [wagerType, setWagerType] = useState<WagerType>('standard')
  const [description, setDescription] = useState('')
  const [eventDateTime, setEventDateTime] = useState('') // "YYYY-MM-DDTHH:mm" local time
  const [depositWindow, setDepositWindow] = useState('0') // enum index
  const [myStake, setMyStake] = useState('')
  const [challengerStake, setChallengerStake] = useState('')
  const [challengerAddress, setChallengerAddress] = useState('')
  const [category, setCategory] = useState('0') // enum index
  const [tokenIdx, setTokenIdx] = useState('0') // index into PRICE_BET_TOKENS
  const [targetPrice, setTargetPrice] = useState('')
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [referrer, setReferrer] = useState('')
  // Pull the referrer captured from a ?ref= link (stored by the referral page).
  // Not a visible field — bound on-chain on the user's first wager.
  useEffect(() => {
    try {
      const pending = localStorage.getItem('opus_pending_referrer')
      if (pending) setReferrer(pending)
    } catch {}
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
  // Earliest valid moment = now + window (+1h margin), shown in UTC.
  const earliestValidLabel = new Date((nowTs + windowSeconds + 3600) * 1000).toUTCString()
  const eventUtcLabel = eventDateTime ? new Date(eventDateTime).toUTCString() : ''
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !address) {
      alert('Please connect your wallet')
      return
    }
    const requiredFields = wagerType === 'standard'
      ? [description, eventDateTime, depositWindow, myStake, challengerStake, category]
      : [description, eventDateTime, depositWindow, myStake, challengerStake, targetPrice, category]
    if (requiredFields.some(f => !f)) {
      alert('Please fill in all required fields')
      return
    }
    if (!isEventDateValid) {
      alert(`Event date is too soon for the selected deposit window. Earliest valid (UTC): ${earliestValidLabel}`)
      return
    }
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
      if (wagerType === 'standard') {
        // creatorStake is derived on-chain from msg.value:
        //   voteDeposit  = msg.value * 500 / 10500
        //   creatorStake = msg.value - voteDeposit
        // So sending stake + 5% makes creatorStake == stake.
        const msgValue = stake + (stake * BigInt(500)) / BigInt(10000)
        writeContract({
          address: WAGER_MARKET_ADDRESS,
          abi: WAGER_MARKET_ABI,
          functionName: 'createWager',
          args: [
            resolvedChallenger as `0x${string}`,
            description,
            BigInt(eventTimestamp),
            depositWindowEnum,
            challengerStakeWei,
            categoryEnum,
            resolvedReferrer as `0x${string}`,
          ],
          value: msgValue,
        })
      } else {
        // Price bet: no vote deposit -- creatorStake == msg.value exactly.
        const queryId = PRICE_BET_TOKENS[parseInt(tokenIdx, 10)].queryId
        writeContract({
          address: WAGER_MARKET_ADDRESS,
          abi: WAGER_MARKET_ABI,
          functionName: 'createPriceBet',
          args: [
            resolvedChallenger as `0x${string}`,
            description,
            BigInt(eventTimestamp),
            depositWindowEnum,
            challengerStakeWei,
            queryId,
            parseEther(targetPrice),
            direction === 'above',
            categoryEnum,
            resolvedReferrer as `0x${string}`,
          ],
          value: stake,
        })
      }
      setShowConfirm(false)
      // Reset form
      setDescription('')
      setEventDateTime(defaultEventDateTime(3))
      setDepositWindow('0')
      setMyStake('')
      setChallengerStake('')
      setChallengerAddress('')
      setCategory('0')
      setTokenIdx('0')
      setTargetPrice('')
      setDirection('above')
      // Keep referrer — it's the captured referral, bound once on-chain.
    } catch (error) {
      console.error('[v0] Error creating wager:', error)
    }
  }
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
        <h2 className="font-serif text-2xl font-bold mb-6">Create a Wager</h2>
        {/* Wager Type Selection */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#f4f4f4] mb-3">Wager Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setWagerType('standard')}
              className={`flex-1 rounded-lg border-2 py-3 font-semibold transition ${
                wagerType === 'standard'
                  ? 'border-[#D8B13D] bg-[#D8B13D]/10 text-[#D8B13D]'
                  : 'border-white/10 text-[#9a9a9a] hover:border-white/20'
              }`}
            >
              Standard Wager
            </button>
            <button
              onClick={() => setWagerType('price-bet')}
              className={`flex-1 rounded-lg border-2 py-3 font-semibold transition ${
                wagerType === 'price-bet'
                  ? 'border-[#D8B13D] bg-[#D8B13D]/10 text-[#D8B13D]'
                  : 'border-white/10 text-[#9a9a9a] hover:border-white/20'
              }`}
            >
              Price Bet
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this wager about?"
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:border-[#D8B13D] focus:outline-none"
              required
            />
          </div>
          {/* My Stake */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">My Stake (PLS)</label>
            <input
              type="number"
              value={myStake}
              onChange={(e) => setMyStake(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:border-[#D8B13D] focus:outline-none"
              required
            />
          </div>
          {/* Event Date & Time -- required for BOTH types. Local time, UTC echo shown. */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">
              Event Date &amp; Time <span className="text-[#9a9a9a] font-normal">(your local time)</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={dateInputRef}
                type="datetime-local"
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] focus:border-[#D8B13D] focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#9a9a9a] hover:border-[#D8B13D] hover:text-[#D8B13D] transition"
                title="Open calendar"
              >
                📅
              </button>
            </div>
            {eventDateTime && (
              <div className="text-xs mt-2 leading-relaxed">
                <span className="text-[#9a9a9a]">UTC: {eventUtcLabel}</span>
                {!isEventDateValid && (
                  <span className="block text-red-400 mt-1">
                    Too soon for a {DEPOSIT_WINDOWS[Number(depositWindow)].label} deposit window.
                    Earliest valid (UTC): {earliestValidLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Deposit Window -- required for BOTH types */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Deposit Window</label>
            <select
              value={depositWindow}
              onChange={(e) => setDepositWindow(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] focus:border-[#D8B13D] focus:outline-none"
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
          {/* Challenger Stake -- required for BOTH types */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Challenger Stake (PLS)</label>
            <input
              type="number"
              value={challengerStake}
              onChange={(e) => setChallengerStake(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:border-[#D8B13D] focus:outline-none"
              required
            />
          </div>
          {/* Price-bet-only fields */}
          {wagerType === 'price-bet' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Token</label>
                <select
                  value={tokenIdx}
                  onChange={(e) => setTokenIdx(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] focus:border-[#D8B13D] focus:outline-none"
                >
                  {PRICE_BET_TOKENS.map((t, i) => (
                    <option key={t.queryId} value={i}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Target Price (USD)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.0001"
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:border-[#D8B13D] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Direction</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setDirection('above')}
                    className={`flex-1 rounded-lg py-3 font-semibold transition ${
                      direction === 'above'
                        ? 'bg-[#D8B13D] text-black'
                        : 'border border-white/10 text-[#9a9a9a] hover:border-white/20'
                    }`}
                  >
                    Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('below')}
                    className={`flex-1 rounded-lg py-3 font-semibold transition ${
                      direction === 'below'
                        ? 'bg-[#D8B13D] text-black'
                        : 'border border-white/10 text-[#9a9a9a] hover:border-white/20'
                    }`}
                  >
                    Below
                  </button>
                </div>
              </div>
            </>
          )}
          {/* Category -- required for BOTH types */}
          <div>
            <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] focus:border-[#D8B13D] focus:outline-none"
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
              className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] placeholder-[#666] focus:border-[#D8B13D] focus:outline-none"
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
                    className="text-xs text-[#9a9a9a] hover:text-[#D8B13D] transition underline decoration-dotted"
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
                      <div className="text-lg font-semibold text-[#D8B13D]">
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
              {wagerType === 'standard' ? (
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
                      <span className="text-[#D8B13D]">Total to Send:</span>
                      <span className="text-[#D8B13D]">{(parseFloat(myStake || '0') * 1.05).toFixed(2)} PLS</span>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <div className="flex justify-between text-[#9a9a9a]">
                      <span>Your Fee ({effectiveFeePercent.toFixed(2)}%):</span>
                      <span className="text-xs">Deducted at resolution</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#9a9a9a]">Stake:</span>
                    <span className="text-[#f4f4f4]">{parseFloat(myStake || '0').toLocaleString()} PLS</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#D8B13D]">Total to Send:</span>
                      <span className="text-[#D8B13D]">{parseFloat(myStake || '0').toLocaleString()} PLS</span>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 text-[#9a9a9a] text-xs">
                    No vote deposit (oracle-resolved). Fee of {effectiveFeePercent.toFixed(2)}% deducted at resolution.
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending || !isEventDateValid}
            className="w-full rounded-lg bg-[#D8B13D] px-6 py-3 font-semibold text-black transition hover:bg-[#D8B13D]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating...' : !isEventDateValid ? 'Pick a later event date' : 'Review & Create Wager'}
          </button>
        </form>
      </div>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-white/10 bg-[#111116] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-8">
              <h3 className="font-serif text-xl font-bold text-[#e8e6e3] mb-1">
                {wagerType === 'standard' ? 'Standard Wager' : 'Price Bet'} -- {CATEGORIES.find(c => c.value.toString() === category)?.label}
              </h3>
              <p className="text-[#9a9a9a] text-sm">
                "{description}" - {eventUtcLabel} (UTC)
              </p>
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
                  <span className="text-[#D8B13D] font-semibold">+{parseFloat(challengerStake || '0').toLocaleString()} PLS</span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-[#D8B13D] font-bold">Total to Send Now:</span>
                  <span className="text-[#D8B13D] font-bold">
                    {wagerType === 'standard'
                      ? (parseFloat(myStake || '0') * 1.05).toFixed(0)
                      : parseFloat(myStake || '0').toLocaleString()}{' '}
                    PLS
                  </span>
                </div>
                <div className="text-xs text-[#9a9a9a] leading-relaxed">
                  {wagerType === 'standard' ? (
                    <>
                      (includes a {(parseFloat(myStake || '0') * 0.05).toFixed(0)} vote deposit which will be returned if you submit a vote for the correct outcome at the resolution of the bet.)
                      <br />
                      Fee of {effectiveFeePercent.toFixed(2)}%, deducted at resolution.
                    </>
                  ) : (
                    <>
                      No vote deposit (oracle-resolved). Fee of {effectiveFeePercent.toFixed(2)}%, deducted at resolution.
                    </>
                  )}
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
                className="flex-1 rounded-lg bg-[#D8B13D] px-4 py-3 font-semibold text-black hover:bg-[#D8B13D]/90 disabled:opacity-50 transition"
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
