'use client'
import { useState, useEffect, useCallback } from 'react'

export interface SavedWallet {
  id: string
  name: string
  address: string
  selected: boolean
}

interface SavedWalletList {
  name: string | null
  wallets: SavedWallet[]
}

const STORAGE_KEY = 'currentWalletList'

/**
 * Read-only access to the wallet list managed on the /portfolio page.
 * Single source of truth: the Portfolio's localStorage entry. This hook never
 * writes — all add/edit/load management stays in /portfolio.
 *
 * Returns the tracked (watch-only) addresses so /stake, /earn and /markets can
 * aggregate read-only data. The CONNECTED wallet (wagmi useAccount) remains the
 * only identity that can sign — treat these addresses as display-only.
 */
export function useSavedWallets() {
  const [list, setList] = useState<SavedWalletList>({ name: null, wallets: [] })

  const refresh = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) { setList({ name: null, wallets: [] }); return }
      const parsed = JSON.parse(raw)
      setList({ name: parsed.name ?? null, wallets: parsed.wallets ?? [] })
    } catch {
      setList({ name: null, wallets: [] })
    }
  }, [])

  useEffect(() => {
    refresh()
    // Pick up changes made in /portfolio (other tab or same tab via focus).
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) refresh() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  const selectedAddresses = list.wallets.filter(w => w.selected).map(w => w.address)

  return {
    listName: list.name,
    wallets: list.wallets,
    selectedAddresses,
    hasSavedWallets: list.wallets.length > 0,
    refresh,
  }
}