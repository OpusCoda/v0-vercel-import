import Image from "next/image"

const ways = [
  {
    title: "Hold",
    art: "/landing/hold-orb.png",
    accent: "#d4af37",
    body: "Receive PLS or PLSX distributions by holding Opus or Coda.",
    cta: "Learn More",
    href: "#tokens",
  },
  {
    title: "Stake",
    art: "/landing/earn-orb.png",
    accent: "#5fbf7f",
    body: "Stake Smaug and benefit from protocol fees, redistributions and fee rebates.",
    cta: "Start Staking",
    href: "#stake",
  },
  {
    title: "Predict",
    art: "/landing/predict-orb.png",
    accent: "#5b9bd5",
    body: "Trade YES and NO positions on real-world events in the Probability Shop.",
    cta: "Browse Markets",
    href: "#markets",
  },
  {
    title: "Challenge",
    art: "/landing/wager-book.png",
    accent: "#9b7fc4",
    body: "Create or accept peer-to-peer wagers and settle outcomes onchain.",
    cta: "Open P2P Market",
    href: "#markets",
  },
]

function OrnamentHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="text-[#d4af37]/50">&#9670;&mdash;</span>
      <h2 className="text-center font-serif text-xl font-bold text-[#d4af37] md:text-2xl">{children}</h2>
      <span className="text-[#d4af37]/50">&mdash;&#9670;</span>
    </div>
  )
}

export { OrnamentHeading }

export function Participate() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <OrnamentHeading>One ecosystem. Four ways to participate</OrnamentHeading>

      <div className="mt-10 grid gap-6 md:grid-cols-4">
        {ways.map((way) => (
          <article
            key={way.title}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#101017] p-6 transition-colors hover:border-[#d4af37]/40"
          >
            <div className="flex items-start gap-4">
              <Image
                src={way.art || "/placeholder.svg"}
                alt={`${way.title} illustration`}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
              />
              <div>
                <h3 className="font-serif text-2xl font-bold" style={{ color: way.accent }}>
                  {way.title}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-[#b8b6b1]">{way.body}</p>
              </div>
            </div>
            <a
              href={way.href}
              className="mt-6 inline-flex w-fit rounded-md border px-5 py-2.5 font-sans text-sm font-medium transition-colors"
              style={{ borderColor: `${way.accent}66`, color: way.accent }}
            >
              {way.cta}
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}
