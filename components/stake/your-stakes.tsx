'use client'

import { useStakeDetails, usePendingReward, getMaturityInfo } from '@/hooks/useStakeDetails'
import { formatSmaugBalance } from '@/lib/staking'
import EggIcon from './egg-icon'

const TIERS = ['Hatchling', 'Drake', 'Dragon', 'Elder Dragon', 'Smaug']
const EGG_TIERS: Record<string, 'hatchling' | 'drake' | 'dragon' | 'elder-dragon' | 'smaug'> = {
  'Hatchling': 'hatchling',
  'Drake': 'drake',
  'Dragon': 'dragon',
  'Elder Dragon': 'elder-dragon',
  'Smaug': 'smaug',
}

// PLS token address (address(0))
const PLS_ADDRESS = '0x0000000000000000000000000000000000000000'
// SMAUG token address
const SMAUG_ADDRESS = '0x7b042f8f8afEbdc79e64a6b0E19F8B7bBD4eEE63'

interface StakeRowProps {
  stakeId: string
}

function StakeRow({ stakeId }: StakeRowProps) {
  const stakeDetails = useStakeDetails(stakeId)
  const plsReward = usePendingReward(stakeId, PLS_ADDRESS)
  const smaugReward = usePendingReward(stakeId, SMAUG_ADDRESS)

  if (!stakeDetails) return null

  const [owner, amount, startTime, duration, endTime, tierIndex, multiplier] = stakeDetails

  const tierName = TIERS[Number(tierIndex)] || 'Unknown'
  const eggTier = EGG_TIERS[tierName] || 'hatchling'
  
  const maturityInfo = getMaturityInfo(startTime, duration)
  const plsFormatted = formatSmaugBalance(plsReward)
  const smaugFormatted = formatSmaugBalance(smaugReward)
  const amountFormatted = formatSmaugBalance(amount)

  return (
    <tr className="hover:bg-[#09090B]">
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">#{stakeId}</td>
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">{amountFormatted} SMAUG</td>
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">
        <div className="flex items-center gap-2">
          <EggIcon tier={eggTier} />
          {tierName}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[#f4f4f4]">{maturityInfo}</td>
      <td className="px-6 py-4 text-sm">
        <div className="space-y-1">
          <div className="text-[#D8B13D] font-semibold">{plsFormatted} PLS</div>
          <div className="text-[#9a9a9a] text-xs">{smaugFormatted} SMAUG</div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="rounded-lg border border-[#D8B13D]/40 px-3 py-1.5 text-sm font-semibold text-[#D8B13D] hover:bg-[#D8B13D]/10 transition-colors">
          Claim
        </button>
      </td>
    </tr>
  )
}

interface YourStakesProps {
  userStakeIds: string[]
  isLoading?: boolean
}

export default function YourStakes({ userStakeIds = [], isLoading = false }: YourStakesProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116]">
      <div className="flex items-center justify-between border-b border-white/10 p-6">
        <h2 className="font-serif text-2xl font-bold text-[#f4f4f4]">
          Your Stakes
        </h2>

        <button className="text-sm font-semibold text-[#D8B13D]">
          View All Stakes →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-[#9a9a9a]">
            <tr>
              {[
                'Stake ID',
                'Amount',
                'Tier',
                'Maturity',
                'Rewards (PLS / SMAUG)',
                'Actions',
              ].map((heading) => (
                <th key={heading} className="px-6 py-4 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {userStakeIds.length > 0 ? (
              userStakeIds.map((stakeId) => (
                <StakeRow key={stakeId} stakeId={stakeId} />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#9a9a9a]">
                  {isLoading ? 'Loading stakes...' : 'No stakes yet. Create your first stake!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
