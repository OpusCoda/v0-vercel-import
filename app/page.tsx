"use client"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import { ethers } from "ethers"

const formatDecimals = (v: string, decimals: number) => {
  const [i, d = ""] = v.split(".")
  return decimals > 0 ? `${i}.${d.padEnd(decimals, "0").slice(0, decimals)}` : i
}

const formatWithCommas = (v: string, decimals = 0) => {
  const [i, d = ""] = v.split(".")
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return decimals > 0 ? `${withCommas}.${d.padEnd(decimals, "0").slice(0, decimals)}` : withCommas
}

const OPUS_CONTRACT = "0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
const CODA_CONTRACT = "0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
const OPUS_ABI = [
  "function getTotalMissorEarned(address) view returns (uint256)", // 0x6887e0b3
  "function getTotalFinvestaEarned(address) view returns (uint256)", // 0x94a17cf0
  "function getTotalWgppEarned(address) view returns (uint256)", // 0xc3aff3e3
]
const CODA_ABI = [
  "function getTotalWethEarned(address) view returns (uint256)", // 0xcdaaa4f0
  "function getTotalWbtcEarned(address) view returns (uint256)", // 0x2eb2c229
  "function getTotalPlsxEarned(address) view returns (uint256)", // 0x442b1c12
]

export default function LandingPage() {
  const [walletAddresses, setWalletAddresses] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [rewards, setRewards] = useState<Array<{
    address: string
    opus: { missor: string; finvesta: string; wgpp: string }
    coda: { weth: string; pWbtc: string; plsx: string }
  }> | null>(null)
  const [error, setError] = useState("")
  const [totalRewards, setTotalRewards] = useState<{
    opus: { missor: string; finvesta: string; wgpp: string }
    coda: { weth: string; pWbtc: string; plsx: string }
  } | null>(null)

  const fetchRewards = async () => {
    if (walletAddresses.some((addr) => !addr.trim())) {
      setError("Please enter valid wallet addresses")
      return
    }

    setLoading(true)
    setError(null)
    setRewards(null)

    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
      const opusContract = new ethers.Contract(OPUS_CONTRACT, OPUS_ABI, provider)
      const codaContract = new ethers.Contract(CODA_CONTRACT, CODA_ABI, provider)

      const allRewards = []
      for (const address of walletAddresses) {
        console.log("[v0] Fetching rewards for:", address)

        let opusMissor = "0"
        let opusFinvesta = "0"
        let opusWgpp = "0"
        let codaWeth = "0"
        let codaPWbtc = "0"
        let codaPlsx = "0"

        try {
          opusMissor = (await opusContract.getTotalMissorEarned(address)).toString()
          console.log("[v0] Opus Missor:", opusMissor)
        } catch (err) {
          console.error("[v0] Error fetching Opus Missor:", err)
        }

        try {
          opusFinvesta = (await opusContract.getTotalFinvestaEarned(address)).toString()
          console.log("[v0] Opus Finvesta:", opusFinvesta)
        } catch (err) {
          console.error("[v0] Error fetching Opus Finvesta:", err)
        }

        try {
          opusWgpp = (await opusContract.getTotalWgppEarned(address)).toString()
          console.log("[v0] Opus WGPP:", opusWgpp)
        } catch (err) {
          console.error("[v0] Error fetching Opus WGPP:", err)
        }

        try {
          codaWeth = (await codaContract.getTotalWethEarned(address)).toString()
          console.log("[v0] Coda WETH:", codaWeth)
        } catch (err) {
          console.error("[v0] Error fetching Coda WETH:", err)
        }

        try {
          codaPWbtc = (await codaContract.getTotalWbtcEarned(address)).toString()
          console.log("[v0] Coda pWBTC:", codaPWbtc)
        } catch (err) {
          console.error("[v0] Error fetching Coda pWBTC:", err)
        }

        try {
          codaPlsx = (await codaContract.getTotalPlsxEarned(address)).toString()
          console.log("[v0] Coda PLSX:", codaPlsx)
        } catch (err) {
          console.error("[v0] Error fetching Coda PLSX:", err)
        }

        allRewards.push({
          address,
          opus: {
            missor: ethers.formatUnits(opusMissor, 18),
            finvesta: ethers.formatUnits(opusFinvesta, 8),
            wgpp: ethers.formatUnits(opusWgpp, 18),
          },
          coda: {
            weth: ethers.formatUnits(codaWeth, 18),
            pWbtc: ethers.formatUnits(codaPWbtc, 8),
            plsx: ethers.formatUnits(codaPlsx, 18),
          },
        })
      }

      setRewards(allRewards)

      const totals = allRewards.reduce(
        (acc, wallet) => ({
          opus: {
            missor: (Number.parseFloat(acc.opus.missor) + Number.parseFloat(wallet.opus.missor)).toString(),
            finvesta: (Number.parseFloat(acc.opus.finvesta) + Number.parseFloat(wallet.opus.finvesta)).toString(),
            wgpp: (Number.parseFloat(acc.opus.wgpp) + Number.parseFloat(wallet.opus.wgpp)).toString(),
          },
          coda: {
            weth: (Number.parseFloat(acc.coda.weth) + Number.parseFloat(wallet.coda.weth)).toString(),
            pWbtc: (Number.parseFloat(acc.coda.pWbtc) + Number.parseFloat(wallet.coda.pWbtc)).toString(),
            plsx: (Number.parseFloat(acc.coda.plsx) + Number.parseFloat(wallet.coda.plsx)).toString(),
          },
        }),
        {
          opus: { missor: "0", finvesta: "0", wgpp: "0" },
          coda: { weth: "0", pWbtc: "0", plsx: "0" },
        },
      )
      setTotalRewards(totals)
    } catch (err) {
      console.error("[v0] Error fetching rewards:", err)
      setError("Failed to fetch rewards. Please check the wallet addresses and try again.")
    } finally {
      setLoading(false)
    }
  }

  const addWalletInput = () => {
    setWalletAddresses([...walletAddresses, ""])
  }

  const removeWalletInput = (index: number) => {
    const newAddresses = walletAddresses.filter((_, i) => i !== index)
    setWalletAddresses(newAddresses.length > 0 ? newAddresses : [""])
  }

  const updateWalletAddress = (index: number, value: string) => {
    const newAddresses = [...walletAddresses]
    newAddresses[index] = value
    setWalletAddresses(newAddresses)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#0d1426] to-[#0a1b3a] text-slate-100 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-5xl w-full"
      >
        <h1 className="text-center text-6xl md:text-8xl font-['Marcellus_SC'] font-normal tracking-tight text-slate-200 mb-12">
          Opus and Coda
        </h1>
        <Card className="bg-[#0f172a]/90 backdrop-blur border border-blue-900/40 shadow-[0_0_80px_rgba(56,189,248,0.08)] rounded-3xl">
          <CardContent className="p-12 flex flex-col gap-14">
            <div className="text-center space-y-8">
              <img
                src="/opuscoda.jpg"
                alt="Opus & Coda logo"
                className="mx-auto w-64 h-64 md:w-80 md:h-80 rounded-3xl shadow-[0_0_80px_rgba(249,115,22,0.35)]"
              />
              <p className="text-slate-200 text-lg md:text-2xl max-w-4xl mx-auto leading-relaxed">
                The reliable and transparent printer ecosystem on Pulsechain
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(56,189,248,0.1)] bg-black">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/gYR8UD9RlWg?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1"
                title="Opus and Coda explainer video"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={false}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">Reliable printing</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Our printers deliver a steady minimum 1% daily ROI.
                </p>
              </div>
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">No extraction paths</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  No privileged wallets. No silent drains. No broken promises.
                </p>
              </div>
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">Automatic payouts</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Simply hold Opus or Coda and your rewards arrive automatically.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="rounded-2xl bg-[#111c3a] border border-orange-900/30 p-8 shadow-inner">
                <h3 className="text-2xl font-medium mb-4 text-orange-300 text-center">Opus</h3>
                <p className="text-slate-200 text-lg mb-4 text-center font-semibold">6% Tax</p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex justify-between">
                    <span>Missor</span>
                    <span className="text-orange-300 font-medium">3%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Finvesta</span>
                    <span className="text-orange-300 font-medium">1%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>World's Greatest pDAI Printer</span>
                    <span className="text-orange-300 font-medium">1%</span>
                  </li>
                  <li className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                    <span>Added to liquidity</span>
                    <span className="text-orange-300 font-medium">1%</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl bg-[#111c3a] border border-cyan-900/30 p-8 shadow-inner">
                <h3 className="text-2xl font-medium mb-4 text-cyan-300 text-center">Coda</h3>
                <p className="text-slate-200 text-lg mb-4 text-center font-semibold">7% Tax</p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex justify-between">
                    <span>WETH</span>
                    <span className="text-cyan-300 font-medium">2%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>pWBTC</span>
                    <span className="text-cyan-300 font-medium">2%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>PLSX</span>
                    <span className="text-cyan-300 font-medium">2%</span>
                  </li>
                  <li className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                    <span>Added to liquidity</span>
                    <span className="text-cyan-300 font-medium">1%</span>
                  </li>
                </ul>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center space-y-8"
            >
              <h2 className="text-2xl md:text-3xl text-slate-200 font-medium">
                See what has accrued by holding Opus and Coda
              </h2>
              <div className="max-w-2xl mx-auto space-y-4">
                {walletAddresses.map((address, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => updateWalletAddress(index, e.target.value)}
                      placeholder="Enter wallet address"
                      className="flex-1 px-4 py-3 bg-[#111c3a] border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    {walletAddresses.length > 1 && (
                      <button
                        onClick={() => removeWalletInput(index)}
                        className="px-4 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={addWalletInput}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                  >
                    + Add Another Wallet
                  </button>
                  <button
                    onClick={fetchRewards}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-cyan-600 hover:from-orange-500 hover:to-cyan-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : rewards && rewards.length > 0 ? "Update Rewards" : "Check Rewards"}
                  </button>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
              {rewards && rewards.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
                  {rewards.length > 1 && totalRewards && (
                    <div className="mb-8">
                      <h3 className="text-2xl font-medium text-slate-200 mb-6 text-center">
                        Total Accumulated Rewards
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        <div className="rounded-2xl bg-gradient-to-br from-orange-900/20 to-[#111c3a] border border-orange-500/50 p-6 shadow-lg shadow-orange-500/20">
                          <h3 className="text-xl font-medium mb-4 text-orange-300 text-center">Opus Total</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">Missor:</span>
                              <span className="text-slate-100 font-medium">
                                {formatWithCommas(totalRewards.opus.missor)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">Finvesta:</span>
                              <span className="text-slate-100 font-medium">
                                {formatDecimals(totalRewards.opus.finvesta, 2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">WGPP:</span>
                              <span className="text-slate-100 font-medium">
                                {formatDecimals(totalRewards.opus.wgpp, 2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-cyan-900/20 to-[#111c3a] border border-cyan-500/50 p-6 shadow-lg shadow-cyan-500/20">
                          <h3 className="text-xl font-medium mb-4 text-cyan-300 text-center">Coda Total</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">WETH:</span>
                              <span className="text-slate-100 font-medium">
                                {formatDecimals(totalRewards.coda.weth, 6)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">pWBTC:</span>
                              <span className="text-slate-100 font-medium">
                                {formatDecimals(totalRewards.coda.pWbtc, 4)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">PLSX:</span>
                              <span className="text-slate-100 font-medium">
                                {formatWithCommas(totalRewards.coda.plsx)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {rewards.map((walletRewards, walletIndex) => (
                    <div key={walletIndex} className="space-y-4">
                      <p className="text-slate-400 text-sm font-mono">
                        {walletRewards.address.slice(0, 6)}...{walletRewards.address.slice(-4)}
                      </p>
                      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        <div className="rounded-2xl bg-[#111c3a] border border-orange-900/30 p-6">
                          <h3 className="text-xl font-medium mb-4 text-orange-300 text-center">Opus Rewards</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">Missor:</span>
                              <span className="text-slate-100 font-medium">
                                {formatWithCommas(walletRewards.opus.missor)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">Finvesta:</span>
                              <span className="text-slate-100 font-medium">
                                {formatDecimals(walletRewards.opus.finvesta, 2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">WGPP:</span>
                              <span className="text-slate-100 font-medium">
                                {formatDecimals(walletRewards.opus.wgpp, 2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#111c3a] border border-cyan-900/30 p-6">
                          <h3 className="text-xl font-medium mb-4 text-cyan-300 text-center">Coda Rewards</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">WETH:</span>
                              <span className="text-slate-100 font-medium">
                                {formatDecimals(walletRewards.coda.weth, 6)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">pWBTC:</span>
                              <span className="text-slate-100 font-medium">
                                {formatDecimals(walletRewards.coda.pWbtc, 4)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">PLSX:</span>
                              <span className="text-slate-100 font-medium">
                                {formatWithCommas(walletRewards.coda.plsx)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
            <div className="text-center space-y-8">
              <h2 className="text-2xl md:text-3xl text-slate-200 font-medium">
                Have you decided how many of each to own?
              </h2>
              <div className="flex flex-col md:flex-row justify-center items-center gap-12">
                <Link
                  href="https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/?outputCurrency=0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300"
                >
                  <img
                    src="/opus.jpg"
                    alt="Opus logo"
                    className="w-48 h-48 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-shadow duration-300"
                  />
                  <span className="text-xl font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors">
                    Buy Opus
                  </span>
                </Link>
                <Link
                  href="https://pulsex.mypinata.cloud/ipfs/bafybeift2yakeymqmjmonkzlx2zyc4tty7clkwvg37suffn5bncjx4e6xq/#/?outputCurrency=0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300"
                >
                  <img
                    src="/coda1.jpg"
                    alt="Coda logo"
                    className="w-48 h-48 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-shadow duration-300"
                  />
                  <span className="text-xl font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors">
                    Buy Coda
                  </span>
                </Link>
              </div>
            </div>
            <div>
              <p className="text-slate-200 text-sm mb-4 text-center">Contract addresses</p>
              <div className="space-y-3 text-cyan-300 text-base text-center">
                <div>
                  <Link
                    href="https://otter.pulsechain.com/address/0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-cyan-200 transition"
                  >
                    Opus: 0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4
                  </Link>
                </div>
                <div>
                  <Link
                    href="https://otter.pulsechain.com/address/0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-cyan-200 transition"
                  >
                    Coda: 0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-8">
              <Link href="https://x.com/OpusCodaPrinter" target="_blank" rel="noopener noreferrer" className="group">
                <div className="w-14 h-14 rounded-full bg-[#111c3a] border border-blue-900/30 flex items-center justify-center hover:bg-blue-900/30 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20">
                  <svg
                    className="w-6 h-6 text-slate-400 group-hover:text-cyan-300 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              </Link>
              <Link href="https://t.me/opus_official" target="_blank" rel="noopener noreferrer" className="group">
                <div className="w-14 h-14 rounded-full bg-[#111c3a] border border-blue-900/30 flex items-center justify-center hover:bg-blue-900/30 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20">
                  <svg
                    className="w-6 h-6 text-slate-400 group-hover:text-cyan-300 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
              </Link>
              <Link
                href="https://www.youtube.com/@opustoken"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="w-14 h-14 rounded-full bg-[#111c3a] border border-blue-900/30 flex items-center justify-center hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20">
                  <svg
                    className="w-7 h-7 text-slate-400 group-hover:text-red-400 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="YouTube"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              </Link>
            </div>
            <p className="text-center text-slate-600 text-xs tracking-wide mt-6">© since deployment</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
