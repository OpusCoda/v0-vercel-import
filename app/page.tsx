"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ethers } from "ethers"
import { savePortfolio, loadPortfolio } from "./actions"

export default function Home() {
  const searchParams = useSearchParams()
  const [wallets, setWallets] = useState<{ address: string; label?: string }[]>([])
  const [newWallet, setNewWallet] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loadId, setLoadId] = useState("")
  const [saving, setSaving] = useState(false)

  const provider = useMemo(() => new ethers.JsonRpcProvider("https://rpc.pulsechain.com"), [])

  const vaultManager = useMemo(() => {
    const liquidLoansVaultManagerAddress = "0xD79bfb86fA06e8782b401bC0197d92563602D2Ab"
    const liquidLoansAbi = [
      "function getTroveColl(address) view returns (uint256)",
      "function getTroveDebt(address) view returns (uint256)",
    ]
    return new ethers.Contract(liquidLoansVaultManagerAddress, liquidLoansAbi, provider)
  }, [provider])

  useEffect(() => {
    const urlId = searchParams.get("id")
    let loaded: { address: string; label?: string }[] = []

    if (urlId) {
      // Decode Portfolio ID from URL
      try {
        const paddedId = urlId + "=".repeat((4 - (urlId.length % 4)) % 4)
        const decoded = JSON.parse(atob(paddedId))
        loaded = decoded.wallets || []
      } catch (e) {
        console.error("Failed to decode Portfolio ID from URL", e)
        setError("Invalid Portfolio ID in URL")
      }
    } else {
      // Load from localStorage
      const stored = localStorage.getItem("tracker_portfolio")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          loaded = parsed.wallets || []
        } catch (e) {
          console.error("Failed to parse stored wallets", e)
        }
      }
    }

    if (JSON.stringify(loaded) !== JSON.stringify(wallets)) {
      setWallets(loaded)
      if (loaded.length > 0) {
        localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets: loaded }))
      }
    }
  }, [searchParams])

  // Add wallet
  const addWallet = () => {
    if (!ethers.isAddress(newWallet) || wallets.some((w) => w.address.toLowerCase() === newWallet.toLowerCase())) {
      setError("Invalid or duplicate address")
      return
    }
    const updated = [...wallets, { address: newWallet, label: newLabel || "" }]
    setWallets(updated)
    localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets: updated }))
    setNewWallet("")
    setNewLabel("")
    setError("")
  }

  // Remove wallet
  const removeWallet = (index: number) => {
    const updated = wallets.filter((_, i) => i !== index)
    setWallets(updated)
    localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets: updated }))
  }

  const savePortfolioId = async () => {
    if (wallets.length === 0) {
      alert("Add at least one wallet first")
      return
    }

    setSaving(true)
    try {
      const result = await savePortfolio(wallets)

      if (result.success && result.portfolioId) {
        navigator.clipboard.writeText(result.portfolioId)
        alert(
          `Your Portfolio ID ${result.portfolioId} is copied to your clipboard!\n\nUse this ID in any browser to load your wallets!`,
        )
      } else {
        alert(`Error: ${result.error || "Failed to save portfolio"}`)
      }
    } catch (error) {
      console.error("Error saving portfolio:", error)
      alert("Failed to save portfolio. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const loadPortfolioById = async () => {
    if (!loadId.trim()) {
      setError("Enter a Portfolio ID")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await loadPortfolio(loadId.trim())

      if (result.success && result.wallets) {
        setWallets(result.wallets)
        localStorage.setItem("tracker_portfolio", JSON.stringify({ wallets: result.wallets }))
        setLoadId("")
        alert(`Portfolio loaded successfully! (${result.wallets.length} wallet${result.wallets.length > 1 ? "s" : ""})`)
      } else {
        setError(result.error || "Portfolio ID not found")
      }
    } catch (error) {
      console.error("Error loading portfolio:", error)
      setError("Failed to load portfolio. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch aggregated data
  const fetchData = async () => {
    if (wallets.length === 0) {
      setError("Add at least one wallet")
      return
    }

    setLoading(true)
    setError("")
    setData(null)

    try {
      let totalPLS = ethers.parseEther("0")
      let totalLockedPLS = ethers.parseEther("0")
      let totalDebt = ethers.parseEther("0")

      for (const wallet of wallets) {
        const plsBalance = await provider.getBalance(wallet.address)
        totalPLS = totalPLS + plsBalance
        const lockedPLS = await vaultManager.getTroveColl(wallet.address)
        totalLockedPLS = totalLockedPLS + lockedPLS
        const debtUSDL = await vaultManager.getTroveDebt(wallet.address)
        totalDebt = totalDebt + debtUSDL
      }

      setData({
        totalPLS: ethers.formatEther(totalPLS),
        totalLockedPLS: ethers.formatEther(totalLockedPLS),
        totalDebt: ethers.formatEther(totalDebt),
        walletCount: wallets.length,
      })
    } catch (err) {
      setError("Error fetching data")
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-5">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl mb-8 text-center">Pulsechain Portfolio Tracker</h1>

        {/* Wallet Management */}
        <section className="mb-8 p-6 border-4 border-white">
          <h2 className="text-xl mb-4">Manage Wallets</h2>
          <div className="space-y-4 mb-4">
            <input
              className="w-full p-3 bg-black border-2 border-white text-white"
              placeholder="Wallet Address"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
            />
            <input
              className="w-full p-3 bg-black border-2 border-white text-white"
              placeholder="Label (optional)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <button
              className="w-full p-3 bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-colors"
              onClick={addWallet}
            >
              Add Wallet
            </button>
          </div>

          {wallets.length > 0 && (
            <div className="space-y-2 mb-4">
              {wallets.map((w, i) => (
                <div key={i} className="flex justify-between items-center p-2 border border-white">
                  <span>{w.label || w.address.slice(0, 6) + "..." + w.address.slice(-4)}</span>
                  <button className="px-3 py-1 bg-red-600 text-white hover:bg-red-700" onClick={() => removeWallet(i)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {wallets.length > 0 && (
            <div className="space-y-2">
              <button
                className="w-full p-3 bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                onClick={savePortfolioId}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Portfolio ID"}
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t-2 border-white">
            <h3 className="text-lg mb-3">Load Portfolio by ID</h3>
            <p className="text-sm mb-3 text-gray-400">Enter a Portfolio ID to load wallets from any browser</p>
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 bg-black border-2 border-white text-white"
                placeholder="Enter Portfolio ID (e.g., M2P668)"
                value={loadId}
                onChange={(e) => setLoadId(e.target.value)}
              />
              <button
                className="px-6 p-3 bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                onClick={loadPortfolioById}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load"}
              </button>
            </div>
          </div>
        </section>

        {/* Main Data */}
        <section className="p-6 border-4 border-white">
          <button
            className="w-full p-4 mb-4 bg-black text-white border-2 border-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            onClick={fetchData}
            disabled={loading || wallets.length === 0}
          >
            {loading ? "Loading..." : "Track Portfolio"}
          </button>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {data && (
            <div className="space-y-6">
              <div className="p-4 border-2 border-white">
                <h3 className="text-lg mb-2">Total Assets</h3>
                <p>Wallets: {data.walletCount}</p>
                <p>Total PLS: {Number.parseFloat(data.totalPLS).toFixed(2)}</p>
              </div>
              <div className="p-4 border-2 border-white">
                <h3 className="text-lg mb-2">Liquid Loans (Aggregated)</h3>
                <p>Total Locked PLS: {Number.parseFloat(data.totalLockedPLS).toFixed(2)}</p>
                <p>Total Debt (USDL): {Number.parseFloat(data.totalDebt).toFixed(2)}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
