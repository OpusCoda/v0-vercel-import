"use client"

import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#0b0b0d] text-white flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#D4AF37] mb-6">
          Opus and Coda printers on Pulsechain
        </h1>

        <Link href="/portfolio">
          <button className="px-8 py-4 text-lg bg-[#7028E4] hover:bg-[#5c1fc7] text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl">
            View Portfolio
          </button>
        </Link>
      </div>
    </div>
  )
}
