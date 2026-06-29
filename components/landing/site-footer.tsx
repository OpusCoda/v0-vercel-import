import Image from "next/image"
import Link from "next/link"

const columns = [
  {
    heading: "Links",
    items: [
      { label: "Docs", href: "#" },
      { label: "Litepaper", href: "#" },
      { label: "Audit", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Community",
    items: [
      { label: "X (Twitter)", href: "https://x.com/OpusEco" },
      { label: "Telegram", href: "https://t.me/opus_official" },
      { label: "YouTube", href: "https://www.youtube.com/@opustoken" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-[#2a2a35] bg-[#0a0a0c]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <Image src="/smaug-circle.png" alt="" width={36} height={36} className="rounded-full" />
              <span className="font-serif text-lg font-bold tracking-[0.18em] text-[#e8e6e3]">OPUSECO</span>
            </div>
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-[#9ca3af]">
              Building sustainable value on PulseChain through participation and community.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-sans text-sm font-semibold text-[#e8e6e3]">{col.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="font-sans text-sm text-[#9ca3af] transition-colors hover:text-[#d4af37]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Disclaimer */}
          <div>
            <h3 className="font-sans text-sm font-semibold text-[#e8e6e3]">Disclaimer</h3>
            <p className="mt-4 font-sans text-sm leading-relaxed text-[#9ca3af]">
              OpusEco is a DeFi ecosystem on PulseChain. Always do your own research. Nothing here is financial advice.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-[#2a2a35] pt-6">
          <p className="font-sans text-xs text-[#7c7a76]">© 2024 OpusEco. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
