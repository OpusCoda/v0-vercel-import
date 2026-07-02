import { TIERS } from './create-stake-card'

export default function TierProgression() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
      <h2 className="mb-5 font-serif text-2xl font-bold text-[#f4f4f4]">
        Tier Progression
      </h2>

      <div className="space-y-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className="rounded-xl border border-white/10 bg-[#09090B] p-4"
          >
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a1a20] text-xl">
                  {tier.icon}
                </div>

                <div>
                  <p className="font-semibold text-[#f4f4f4]">{tier.name}</p>
                  <p className="text-xs text-[#9a9a9a]">
                    {tier.min}
                    {tier.max !== tier.min ? `–${tier.max}` : ''} days
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-[#D8B13D]">{tier.multiplier}x</p>
                <p className="text-xs text-[#9a9a9a]">Multiplier</p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-[#f4f4f4]">{tier.feeRebate}%</p>
                <p className="text-xs text-[#9a9a9a]">Fee Rebate</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}