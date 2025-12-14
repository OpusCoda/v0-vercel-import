"use client"

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#0d1426] to-[#0a1b3a] text-slate-100 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-5xl w-full"
      >
        <Card className="bg-[#0f172a]/90 backdrop-blur border border-blue-900/40 shadow-[0_0_80px_rgba(56,189,248,0.08)] rounded-3xl">
          <CardContent className="p-12 grid gap-14">
            <div className="flex items-center gap-8">  {/* reduced base gap, kept larger on md+ */}
  <h1 className="text-5xl md:text-6xl font-['Roboto'] font-bold tracking-tight text-slate-200">
    Opus and Coda
  </h1>
  <img
  src="/opuscoda.jpg"
  alt="Opus & Coda logo"
  className="w-40 h-40 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.25)] flex-shrink-0 translate-x-2"
  />
</div>

            <div className="text-center">
              <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                A printer ecosystem built for consistency, not spectacle
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(56,189,248,0.1)] bg-black">
  <iframe
    className="w-full aspect-video"
    src="https://www.youtube.com/embed/Zy_E_ktHuCM?autoplay=1&mute=1&loop=1&playlist=Zy_E_ktHuCM&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&disablekb=1&widget_referrer=blank"
    title="Opus and Coda explainer video"
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen={false}  // This disables the fullscreen button entirely
  />
</div>

            {/* Key points */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">Reliable printing</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Engineered for a steady minimum 1% daily ROI over time.
                </p>
              </div>
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">No dev extraction</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  No privileged wallets. No silent drains. No games.
                </p>
              </div>
              <div className="rounded-2xl bg-[#111c3a] border border-blue-900/30 p-7 shadow-inner">
                <h3 className="text-xl font-medium mb-3 text-cyan-300">Automatic rewards</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Simply hold Opus or Coda. Rewards arrive automatically—nothing to claim, nothing to manage.
                </p>
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
              <Link href="https://www.youtube.com/@opustoken" target="_blank" rel="noopener noreferrer" className="group">
  <div className="w-14 h-14 rounded-full bg-[#111c3a] border border-blue-900/30 flex items-center justify-center hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20">
    <svg
      className="w-7 h-7 text-slate-400 group-hover:text-red-400 transition-colors"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-label="YouTube"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  </div>
</Link>
            </div>

            {/* Footer note */}
            <p className="text-center text-slate-600 text-xs tracking-wide mt-6">
            The long view tends to win.
            </p>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
