import Image from "next/image"

const ways = [
  {
    title: "Earn",
    art: "/landing/earn-orb.png",
    accent: "#5fbf7f",
    body: "Stake Smaug and earn PLS, PLSX, and Coda rewards. The longer you stake, the greater the power.",
    cta: "Start Earning",
    href: "#stake",
  },
  {
    title: "Predict",
    art: "/landing/predict-orb.png",
    accent: "#5b9bd5",
    body: "Trade on real-world outcomes in the Probability Shop. Buy YES or NO and earn if you're right.",
    cta: "Go to Markets",
    href: "#markets",
  },
  {
    title: "Wager",
    art: "/landing/wager-book.png",
    accent: "#9b7fc4",
    body: "Challenge the community in Oath Vault. Create or accept wagers and let the outcome decide.",
    cta: "Enter Oath Vault",
    href: "#wager",
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
      <OrnamentHeading>Three ways to participate in the ecosystem</OrnamentHeading>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
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
