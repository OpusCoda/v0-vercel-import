'use client'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useSavedWallets } from '@/hooks/useSavedWallets'

export function WalletContextPrompt() {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { hasSavedWallets, selectedAddresses } = useSavedWallets()

  if (isConnected) {
    if (!hasSavedWallets) return null
    return (
      <div className="mb-4 text-center font-sans text-xs text-[#7c7a76]">
        Also tracking {selectedAddresses.length} wallet{selectedAddresses.length === 1 ? '' : 's'} ·{' '}
        <Link href="/portfolio" className="text-[#B87333] hover:underline">Manage in Portfolio</Link>
      </div>
    )
  }

  if (hasSavedWallets) {
    return (
      <div className="mb-6 rounded-lg border border-[#2a2a35] bg-[#101017] p-4 text-center">
        <p className="font-sans text-sm text-[#b8b6b1]">
          Rendering {selectedAddresses.length} tracked wallet{selectedAddresses.length === 1 ? '' : 's'}.
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            onClick={() => openConnectModal?.()}
            className="rounded-lg bg-[#B87333] px-4 py-2 font-sans text-xs font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]"
          >
            Connect to a wallet
          </button>
          <Link href="/portfolio" className="font-sans text-xs text-[#B87333] hover:underline">
            Manage wallets in Portfolio section →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-lg border border-[#2a2a35] bg-[#101017] p-4 text-center">
      <p className="font-sans text-sm text-[#b8b6b1]">See your positions.</p>
      <div className="mt-2 flex items-center justify-center gap-4">
        <button
          onClick={() => openConnectModal?.()}
          className="rounded-lg bg-[#B87333] px-4 py-2 font-sans text-xs font-semibold text-[#0a0a0c] transition-colors hover:bg-[#e8c860]"
        >
          Connect wallet
        </button>
        <Link href="/portfolio" className="font-sans text-xs text-[#B87333] hover:underline">
          or add or load your wallets in the Portfolio section →
        </Link>
      </div>
    </div>
  )
}