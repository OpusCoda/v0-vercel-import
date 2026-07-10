'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseEther, isAddress } from 'viem'
import { WAGER_MARKET_ADDRESS, WAGER_MARKET_ABI } from '@/lib/wager-market'
type WagerType = 'standard' | 'price-bet'
const CATEGORIES = [
  { value: 0, label: 'Sports' },
  { value: 1, label: 'Crypto' },
  { value: 2, label: 'Politics' },
  { value: 3, label: 'Entertainment' },
  { value: 4, label: 'Other' },
]
const TOKENS = [
  { id: 0, label: 'PLS', symbol: 'PLS' },
  { id: 1, label: 'PLSX', symbol: 'PLSX' },
  { id: 2, label: 'HEX', symbol: 'HEX' },
  { id: 3, label: 'INC', symbol: 'INC' },
]
const DEPOSIT_WINDOWS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
]
export function CreateWager() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending } = useWriteContract()
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [wagerType, setWagerType] = useState<WagerType>('standard')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [depositWindow, setDepositWindow] = useState('1')
  const [myStake, setMyStake] = useState('')
  const [challengerStake, setChallengerStake] = useState('')
  const [challengerAddress, setChallengerAddress] = useState('')
  const [category, setCategory] = useState('0')
  const [token, setToken] = useState('0')
  const [targetPrice, setTargetPrice] = useState('')
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [showConfirm, setShowConfirm] = useState(false)
  const [protocolFeePercent, setProtocolFeePercent] = useState<number>(0)
  // Initialize eventDate to today on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setEventDate(today)
  }, [])
  // Fetch fee info
  const { data: feeInfoData } = useReadContract({
    address: WAGER_MARKET_ADDRESS,
    abi: WAGER_MARKET_ABI,
    functionName: 'getUserFeeInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 60000 },
  })
  useEffect(() => {
    if (feeInfoData) {
      const feeData = feeInfoData as any
      setProtocolFeePercent(Number(feeData.protocolFeePercent) / 100) // Convert to percentage
    }
  }, [feeInfoData])
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      alert('Please connect your wallet')
      return
    }
    // Validate required fields
    const requiredFields = wagerType === 'standard'
      ? [description, eventDate, myStake, challengerStake, category]
      : [description, myStake, challengerStake, token, targetPrice]

    if (requiredFields.some(f => !f)) {
      alert('Please fill in all required fields')
      return
    }
    // Show confirmation
    setShowConfirm(true)
  }
  const handleConfirm = async () => {
    if (!isConnected || !address) return

    // Validate optional challenger address before building the tx
    const resolvedChallenger =
      challengerAddress === ''
        ? '0x0000000000000000000000000000000000000000'
        : challengerAddress
    if (challengerAddress !== '' && !isAddress(challengerAddress)) {
      alert('Challenger address is not a valid wallet address')
      return
    }

    try {
      const eventTimestamp = Math.floor(new Date(eventDate).getTime() / 1000)
      const depositWindowSeconds = parseInt(depositWindow) * 86400
      const stake = parseEther(myStake)

      let msgValue = BigInt(0)

      if (wagerType === 'standard') {
        // Standard wager: stake + 5% vote deposit sent upfront (protocol fee deducted at resolution)
        // Arg order verified against ABI. msg.value amount (stake + 5%) still assumes the contract
        // requires exactly that at creation — verify against the createWager body if unsure.
        msgValue = stake + (stake * BigInt(500)) / BigInt(10000)
        writeContract({
          address: WAGER_MARKET_ADDRESS,
          abi: WAGER_MARKET_ABI,
          functionName: 'createWager',
          args: [
            description,
            BigInt(eventTimestamp),
            BigInt(depositWindowSeconds),
            stake,
            parseEther(challengerStake),
            resolvedChallenger as `0x${string}`,
            parseInt(category, 10),
          ],
          value: msgValue,
        })
      } else {
        // Price bet: exact stake (no additional fees)
        // Args verified against ABI: createPriceBet takes no eventDate/depositWindow.
        msgValue = stake
        writeContract({
          address: WAGER_MARKET_ADDRESS,
          abi: WAGER_MARKET_ABI,
          functionName: 'createPriceBet',
          args: [
            description,
            BigInt(parseInt(token)),
            parseEther(targetPrice),
            direction === 'above',
            stake,
            resolvedChallenger as `0x${string}`,
          ],
          value: msgValue,
        })
      }

      setShowConfirm(false)
      // Reset form
      setDescription('')
      setEventDate(new Date().toISOString().split('T')[0])
      setDepositWindow('1')
      setMyStake('')
      setChallengerStake('')
      setChallengerAddress('')
      setCategory('0')
      setToken('0')
      setTargetPrice('')
      setDirection('above')
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
          {/* Common Fields */}
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
          {wagerType === 'standard' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Event Date</label>
                <div className="flex gap-2">
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
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
              </div>
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
              </div>
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
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-[#f4f4f4] mb-2">Token</label>
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-4 py-3 text-[#f4f4f4] focus:border-[#D8B13D] focus:outline-none"
                >
                  {TOKENS.map((t) => (
                    <option key={t.id} value={t.id}>
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
            </>
          )}
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
            {/* Odds */}
            {parseFloat(myStake) > 0 && parseFloat(challengerStake) > 0 && (
              <div className="rounded-lg border border-white/20 bg-[#09090B] p-4">
                <div className="text-sm text-[#9a9a9a] mb-2">Implied Odds</div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-[#D8B13D]">
                    {(parseFloat(myStake) / parseFloat(challengerStake)).toFixed(2)}×
                  </div>
                  <div className="text-xs text-[#9a9a9a]">
                    If you win: +{parseFloat(challengerStake).toLocaleString()} PLS
                  </div>
                </div>
              </div>
            )}
            {/* Fee Info */}
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
                      <span>Protocol Fee ({protocolFeePercent.toFixed(2)}%):</span>
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
                    No additional fees (exact stake)
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-[#D8B13D] px-6 py-3 font-semibold text-black transition hover:bg-[#D8B13D]/90 disabled:opacity-50"
          >
            {isPending ? 'Creating...' : 'Review & Create Wager'}
          </button>
        </form>
      </div>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-white/10 bg-[#111116] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
              <h3 className="font-serif text-xl font-bold text-[#e8e6e3] mb-1">
                {wagerType === 'standard' ? 'Standard Wager' : 'Price Bet'} — {wagerType === 'standard' ? CATEGORIES.find(c => c.value.toString() === category)?.label : 'Crypto'}
              </h3>
              <p className="text-[#9a9a9a] text-sm">
                "{description}"
                {wagerType === 'standard' &&
                  ` · ${new Date(eventDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`}
              </p>
            </div>
            {/* Main Content */}
            <div className="space-y-6 text-sm font-mono">
              {/* Stakes */}
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
              {/* Total to Send */}
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
                      Protocol fee of {protocolFeePercent.toFixed(2)}%, deducted at resolution.
                    </>
                  ) : (
                    <>
                      No additional fees (exact stake)
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Buttons */}
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
