import Image from "next/image"
import { Coins, Flame } from "lucide-react"

const stats = [
  {
    label: "TOTAL SMAUG STAKED",
    value: "539,827,942",
    unit: "SMAUG",
    icon: (
      <Image src="/smaug-circle.png" alt="" width={36} height={36} className="rounded-full" />
    ),
  },
  {
    label: "PLS DISTRIBUTED TODAY",
    value: "1,283,764",
    unit: "PLS",
    icon: <Coins className="h-8 w-8 text-[#d4af37]" />,
  },
  {
    label: "SMAUG BURNED",
    value: "2,415,931,211",
    unit: "SMAUG",
    icon: <Flame className="h-8 w-8 text-[#d4af37]" />,
  },
]

export function StatCards() {
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 md:px-6">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#2a2a35] md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 bg-[#0d0d12] px-6 py-7">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center">{stat.icon}</span>
            <span className="flex flex-col">
              <span className="font-sans text-[11px] tracking-[0.12em] text-[#9ca3af]">{stat.label}</span>
              <span className="mt-1 font-serif text-2xl font-bold text-[#e8e6e3]">
                {stat.value} <span className="text-sm font-normal text-[#9ca3af]">{stat.unit}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center font-sans text-xs text-[#7c7a76]">
        Live data updates every 60 seconds
      </p>
    </section>
  )
}
