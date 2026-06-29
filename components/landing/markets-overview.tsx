import type { LucideIcon } from "lucide-react"
import { Scale, Globe, Users, User, Gavel, Coins, TrendingUp } from "lucide-react"

type Product = {
  name: string
  tagline: string
  accent: string
  Icon: LucideIcon
  description: string
  contract: string
  audience: { Icon: LucideIcon; label: string }
  features: { Icon: LucideIcon; title: string; body: string }[]
}

const products: Product[] = [
  {
    name: "Oath Vault",
    tagline: "Peer-to-peer wager escrow",
    accent: "#d4af37",
    Icon: Scale,
    contract: "OathVault.sol",
    audience: { Icon: User, label: "One-to-one · creator vs. challenger" },
    description:
      "Two parties lock PLS against each other on the outcome of any event — a sports result, a price milestone, a real-world prediction, anything they agree on. The creator sets the terms, the odds, and how long the offer stays open. A challenger accepts by matching their side.",
    features: [
      {
        Icon: Gavel,
        title: "Trustless resolution",
        body: "After the event, both parties vote on the winner. If they agree, payout is automatic. If they disagree, three-of-five community arbitrators resolve the dispute.",
      },
      {
        Icon: TrendingUp,
        title: "Oracle-settled price bets",
        body: 'Price-based wagers (e.g. "PLS above $0.0001 on January 1") resolve automatically via the Fetch Oracle — no votes needed.',
      },
      {
        Icon: Coins,
        title: "On-chain & non-custodial",
        body: "Every wager is escrowed on-chain. Smaug stakers receive a fee discount on all wagers.",
      },
    ],
  },
  {
    name: "Probability Shop",
    tagline: "Prediction market",
    accent: "#5b9bd5",
    Icon: Globe,
    contract: "PredictionMarket.sol",
    audience: { Icon: Users, label: "One-to-many · anyone can take a position" },
    description:
      "Browse open markets and buy YES or NO positions on real-world outcomes using PLS. Markets are created by the protocol on topics like crypto prices, sports results, politics, and macroeconomic events.",
    features: [
      {
        Icon: TrendingUp,
        title: "AMM-priced odds",
        body: "Positions are priced by a constant-product AMM — the more people buy YES, the pricier YES becomes and the cheaper NO gets, reflecting the crowd's current probability estimate.",
      },
      {
        Icon: Coins,
        title: "Winner takes the pot",
        body: "When a market resolves, the winning side shares the full pot proportionally to their positions.",
      },
      {
        Icon: Scale,
        title: "Smaug fee discount",
        body: "Holding and staking Smaug gives a fee discount on all trades, shared with Oath Vault via SmaugStaking.",
      },
    ],
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

export function MarketsOverview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <OrnamentHeading>Two ways to put PLS on an outcome</OrnamentHeading>
      <p className="mx-auto mt-4 max-w-2xl text-pretty text-center font-sans text-base leading-relaxed text-[#b8b6b1]">
        Oath Vault and the Probability Shop are related but mechanically very different products. Both launch with
        on-chain settlement and share the Smaug staking fee discount.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {products.map((product) => (
          <article
            key={product.name}
            className="flex flex-col rounded-2xl border border-[#2a2a35] bg-[#101017] p-6 transition-colors hover:border-[#d4af37]/30 md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#2a2a35] bg-[#0a0a0c]"
                  style={{ boxShadow: `0 0 32px -14px ${product.accent}` }}
                >
                  <product.Icon className="h-7 w-7" style={{ color: product.accent }} aria-hidden />
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-bold" style={{ color: product.accent }}>
                    {product.name}
                  </h3>
                  <p className="font-sans text-sm text-[#9ca3af]">{product.tagline}</p>
                </div>
              </div>
              <span
                className="shrink-0 rounded-full border px-2.5 py-1 font-sans text-[10px] font-semibold tracking-[0.15em]"
                style={{ borderColor: `${product.accent}55`, color: product.accent }}
              >
                COMING SOON
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2 font-sans text-xs text-[#9ca3af]">
              <product.audience.Icon className="h-4 w-4" style={{ color: product.accent }} aria-hidden />
              {product.audience.label}
            </div>

            <p className="mt-4 text-pretty font-sans text-sm leading-relaxed text-[#b8b6b1]">{product.description}</p>

            <ul className="mt-6 flex flex-col gap-4 border-t border-[#2a2a35] pt-6">
              {product.features.map((feature) => (
                <li key={feature.title} className="flex gap-3">
                  <feature.Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: product.accent }} aria-hidden />
                  <div>
                    <p className="font-sans text-sm font-semibold text-[#e8e6e3]">{feature.title}</p>
                    <p className="mt-1 font-sans text-sm leading-relaxed text-[#b8b6b1]">{feature.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 font-mono text-xs text-[#7c7a76]">{product.contract}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
