import { useEffect, useState } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SMAUG_TOKEN, STAKING_CONTRACT, ERC20_ABI, STAKING_ABI } from '@/lib/staking'

export function useApproveAndStake(address: `0x${string}` | undefined) {
  const [pendingStake, setPendingStake] = useState<{ amount: bigint; days: number } | null>(null)
  const [step, setStep] = useState<'idle' | 'approving' | 'staking'>('idle')

  // Check existing allowance
  const { data: allowanceData } = useReadContract({
    address: SMAUG_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, STAKING_CONTRACT as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })

  // For approval
  const { writeContract: approveWrite, data: approveTxHash, isPending: approveIsPending } = useWriteContract()
  
  // For staking
  const { writeContract: stakeWrite, data: stakeTxHash, isPending: stakeIsPending } = useWriteContract()
  
  // Wait for approval to be confirmed
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: { enabled: !!approveTxHash },
  })

  const { isSuccess: stakeConfirmed } = useWaitForTransactionReceipt({
    hash: stakeTxHash,
    query: { enabled: !!stakeTxHash },
  })

  useEffect(() => {
    if (stakeConfirmed) {
      setStep('idle')
    }
  }, [stakeConfirmed])

  // After approval is confirmed, proceed with staking
  useEffect(() => {
    if (approveConfirmed && step === 'approving' && pendingStake) {
      console.log('[v0] Approval confirmed, proceeding to stake')
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
    console.log('[v0] Initiating approve and stake flow with amount:', amount, 'days:', days)
    setPendingStake({ amount, days })

    const currentAllowance = (allowanceData as bigint) ?? 0n
    if (currentAllowance >= amount) {
      // Allowance already sufficient — skip approval
      console.log('[v0] Allowance sufficient, skipping approval')
      setStep('staking')
      stakeWrite({
        address: STAKING_CONTRACT as `0x${string}`,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [amount, BigInt(days * 86400)],
      })
    } else {
      // Request approval first
      setStep('approving')
      approveWrite({
        address: SMAUG_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [STAKING_CONTRACT as `0x${string}`, amount],
      })
    }
  }

  const reset = () => {
    setPendingStake(null)
    setStep('idle')
  }

  return {
    initiateApproveAndStake,
    reset,
    step,
    isApproving: approveIsPending || step === 'approving',
    isStaking: stakeIsPending || step === 'staking',
    isPending: approveIsPending || stakeIsPending,
    approveTxHash,
    stakeTxHash,
  }
}