import Link from "next/link"

const socials = [
  {
    label: "X (Twitter)",
    href: "https://x.com/OpusEco",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    viewBox: "0 0 24 24",
    size: "h-6 w-6",
  },
  {
    label: "Telegram",
    href: "https://t.me/opus_official",
    path: "M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z",
    viewBox: "0 0 24 24",
    size: "h-6 w-6",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@opustoken",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    viewBox: "0 0 24 24",
    size: "h-7 w-7",
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-[#2a2a35] bg-[#0a0a0c]">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          <p className="font-sans text-xs text-[#7c7a76]">
            © Opus Ecosystem — on-chain markets and staking on PulseChain.
          </p>
          <div className="flex gap-4">
            {socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="group"
              >
                <svg
                  className={`${social.size} text-[#9ca3af] transition-colors group-hover:text-[#d4af37]`}
                  fill="currentColor"
                  viewBox={social.viewBox}
                  aria-hidden="true"
                >
                  <path d={social.path} />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
