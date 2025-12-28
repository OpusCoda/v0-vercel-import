"use client"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import { ethers } from "ethers"
const formatDecimals = (v: string, decimals: number) => {
  const [i, d = ""] = v.split(".")
  return decimals > 0
    ? `${i}.${d.padEnd(decimals, "0").slice(0, decimals)}`
    : i
}
const formatWithCommas = (v: string, decimals = 0) => {
  const [i, d = ""] = v.split(".")
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return decimals > 0
    ? `${withCommas}.${d.padEnd(decimals, "0").slice(0, decimals)}`
    : withCommas
}
export default function Home() {
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [rewards, setRewards] = useState<{
    opus: { missor: string; finvesta: string; wgpp: string }
    coda: { weth: string; pWbtc: string; plsx: string }
  } | null>(null)
  const [error, setError] = useState("")
  const fetchRewards = async () => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      setError("Please enter a valid wallet address")
      return
    }
    setLoading(true)
    setError("")
    setRewards(null)
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.pulsechain.com")
      const opusAddress = "0x3d1e671B4486314f9cD3827f3F3D80B2c6D46FB4"
      const codaAddress = "0xC67E1E5F535bDDF5d0CEFaA9b7ed2A170f654CD7"
      const opusAbi = [
        "function getTotalMissorEarned(address) view returns (uint256)", // 0x6887e0b3
        "function getTotalFinvestaEarned(address) view returns (uint256)", // 0x94a17cf0
        "function getTotalWgppEarned(address) view returns (uint256)", // 0xc3aff3e3
      ]
      const codaAbi = [
        "function getTotalWethEarned(address) view returns (uint256)", // 0xcdaaa4f0
        "function getTotalWbtcEarned(address) view returns (uint256)", // 0x2eb2c229
        "function getTotalPlsxEarned(address) view returns (uint256)", // 0x442b1c12
      ]
      const opusContract = new ethers.Contract(opusAddress, opusAbi, provider)
      const codaContract = new ethers.Contract(codaAddress, codaAbi, provider)
      console.log("[v0] Fetching rewards for address:", walletAddress)
      const [missor, finvesta, wgpp, weth, wbtc, plsx] = await Promise.all([
        opusContract.getTotalMissorEarned(walletAddress).catch(() => BigInt(0)),
        opusContract.getTotalFinvestaEarned(walletAddress).catch(() => BigInt(0)),
        opusContract.getTotalWgppEarned(walletAddress).catch(() => BigInt(0)),
        codaContract.getTotalWethEarned(walletAddress).catch(() => BigInt(0)),
        codaContract.getTotalWbtcEarned(walletAddress).catch(() => BigInt(0)),
        codaContract.getTotalPlsxEarned(walletAddress).catch(() => BigInt(0)),
      ])
      console.log("[v0] Raw rewards:", { missor, finvesta, wgpp, weth, wbtc, plsx })
      setRewards({
        opus: {
          missor: ethers.formatUnits(missor, 18),
          finvesta: ethers.formatUnits(finvesta, 8), // ✅ FIX
          wgpp: ethers.formatUnits(wgpp, 18),
        },
        coda: {
          weth: ethers.formatUnits(weth, 18),
          pWbtc: ethers.formatUnits(wbtc, 8), // ✅ FIX - use 8 decimals for pWBTC
          plsx: ethers.formatUnits(plsx, 18),
        },
      })
    } catch (err) {
      console.error("[v0] Error fetching rewards:", err)
      setError("Failed to fetch rewards. Please check the wallet address and try again.")
    } finally {
      setLoading(false)
    }
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
            <div className="space-y-6 mt-12">
              <h2 className="text-2xl md:text-3xl text-slate-200 font-medium text-center">See what has accrued by holding Opus and Coda</h2>
              <p className="text-slate-400 text-center text-sm">
                Enter your wallet address to inspect how much you've earned since 26 Dec 2025.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 rounded-lg bg-[#111c3a] border border-blue-900/30 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
                <button
                  onClick={fetchRewards}
                  disabled={loading}
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Checking..." : "Check Rewards"}
                </button>
              </div>
              {error && <p className="text-red-400 text-center text-sm">{error}</p>}
              {rewards && (
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-8">
                  <div className="rounded-2xl bg-[#111c3a] border border-orange-900/30 p-6">
                    <h3 className="text-xl font-medium mb-4 text-orange-300 text-center">Opus Rewards</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Missor:</span>
                        <span className="text-slate-100 font-medium">
                          {formatWithCommas(rewards.opus.missor)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Finvesta:</span>
                        <span className="text-slate-100 font-medium">
                          {formatDecimals(rewards.opus.finvesta, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">WGPP:</span>
                        <span className="text-slate-100 font-medium">
                          {formatDecimals(rewards.opus.wgpp, 2)}
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
                          {formatDecimals(rewards.coda.weth, 6)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">pWBTC:</span>
                        <span className="text-slate-100 font-medium">
                          {formatDecimals(rewards.coda.pWbtc, 4)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">PLSX:</span>
                        <span className="text-slate-100 font-medium">
                          {formatWithCommas(rewards.coda.plsx)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
