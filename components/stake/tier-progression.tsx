interface Tier {
  name: string
  days: number
  multiplier: number
  feeRebate: number
}

const TIERS: Tier[] = [
  { name: 'Hatchling', days: 30, multiplier: 1, feeRebate: 5 },
  { name: 'Drake', days: 90, multiplier: 1.5, feeRebate: 10 },
  { name: 'Dragon', days: 180, multiplier: 2, feeRebate: 20 },
  { name: 'Elder Dragon', days: 365, multiplier: 3, feeRebate: 30 },
  { name: 'Smaug', days: 730, multiplier: 5, feeRebate: 40 },
]

export default function TierProgression() {
  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-lg bg-[#111116] p-8">
      <h2 className="font-serif text-2xl font-bold text-[#f4f4f4] mb-8">
        Tier Progression
      </h2>

      <div className="space-y-4">
        {TIERS.map((tier, index) => (
          <div
            key={tier.name}
            className={`p-4 rounded-lg border transition-all ${
              tier.multiplier === 5
                ? 'bg-[#0a0a0c] border-[#D8B13D] shadow-lg shadow-[#D8B13D]/10'
                : 'bg-[#0a0a0c] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Tier icon placeholder */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    tier.multiplier === 5
                      ? 'bg-[#D8B13D] text-black'
                      : 'bg-[#1a1a20] text-[#D8B13D]'
                  }`}
                >
                  {['🥚', '🐢', '🐉', '👹', '🐲'][index]}
                </div>
                <div>
                  <p
                    className={`font-sans font-semibold ${
                      tier.multiplier === 5 ? 'text-[#D8B13D]' : 'text-[#f4f4f4]'
                    }`}
                  >
                    {tier.name}
                  </p>
                  <p className="font-sans text-xs text-[#9a9a9a] mt-0.5">
                    {tier.days} days
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-sans text-sm font-semibold text-[#D8B13D]">
                  {tier.multiplier}x
                </p>
                <p className="font-sans text-xs text-[#9a9a9a] mt-1">
                  Multiplier
                </p>
              </div>

              <div className="text-right">
                <p className="font-sans text-sm font-semibold text-[#f4f4f4]">
                  {tier.feeRebate}%
                </p>
                <p className="font-sans text-xs text-[#9a9a9a] mt-1">
                  Fee Rebate
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info section */}
      <div className="mt-8 p-4 bg-[#0a0a0c] border border-[rgba(255,255,255,0.08)] rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-[#D8B13D] text-lg">⭐</span>
          <p className="font-sans text-sm text-[#9a9a9a]">
            The longer you stake, the greater your rewards and fee savings.
          </p>
        </div>
      </div>
    </div>
  )
}
