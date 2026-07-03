import { useEffect, useState } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SMAUG_TOKEN, STAKING_CONTRACT, ERC20_ABI, STAKING_ABI } from '@/lib/staking'

export function useApproveAndStake(address: `0x${string}` | undefined) {
  const [approvalAmount, setApprovalAmount] = useState<bigint | null>(null)
  const [pendingStake, setPendingStake] = useState<{ amount: bigint; days: number } | null>(null)
  const [step, setStep] = useState<'idle' | 'checking' | 'approving' | 'staking'>('idle')

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: SMAUG_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && approvalAmount ? [address, STAKING_CONTRACT as `0x${string}`] : undefined,
    query: { enabled: !!address && !!approvalAmount },
  })

  const { writeContract: approveWrite, data: approveTxHash } = useWriteContract()
  const { writeContract: stakeWrite, isPending: stakeIsPending } = useWriteContract()
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
  hash: approveTxHash,
  query: { enabled: !!approveTxHash },
})

  // Handle approval completion

  useEffect(() => {
  if (approveConfirmed && step === 'approving' && pendingStake) {
    setStep('staking')
    stakeWrite({
      address: STAKING_CONTRACT as `0x${string}`,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [pendingStake.amount, BigInt(pendingStake.days * 86400)],
    })
  }
}, [approveConfirmed, step, pendingStake, stakeWrite])

  const initiateApproveAndStake = (amount: bigint, days: number) => {
    console.log('[v0] Initiating approve and stake flow')
    setApprovalAmount(amount)
    setPendingStake({ amount, days })
    setStep('checking')

    // Request approval
    setStep('approving')
    approveWrite({
      address: SMAUG_TOKEN as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [STAKING_CONTRACT as `0x${string}`, amount],
    })
  }

  const reset = () => {
    setApprovalAmount(null)
    setPendingStake(null)
    setStep('idle')
  }

  return {
    initiateApproveAndStake,
    reset,
    step,
    isApproving: step === 'approving',
    isStaking: step === 'staking',
    isPending: stakeIsPending,
  }
}
