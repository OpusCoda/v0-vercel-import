import Image from "next/image"

const tokens = [
  {
    name: "Opus",
    img: "/opus-circle.png",
    accent: "#cd7f32",
    desc: "Distributes native PLS automatically to holders",
    feature: "Automatic payouts",
    fees: "5% buy/sell tax • 0% transfer tax",
  },
  {
    name: "Coda",
    img: "/coda-circle.png",
    accent: "#cd7f32",
    desc: "Distributes PLSX automatically to holders",
    feature: "Automatic payouts",
    fees: "5% buy/sell tax • 0% transfer tax",
  },
  {
    name: "Smaug",
    img: "/smaug-circle.png",
    accent: "#cd7f32",
    desc: "Deflationary token with staking rewards",
    feature: "Stake to earn rewards",
    fees: "6.50% buy/sell tax • 0% transfer tax",
  },
]

// Holding Smaug boosts your PLS (Opus) and PLSX (Coda) reward payouts.
const smaugTiers = [
  { held: "< 0.0001%", multiplier: "1.00x", bonus: "+0%" },
  { held: "≥ 0.0001%", multiplier: "1.02x", bonus: "+2%" },
  { held: "≥ 0.0005%", multiplier: "1.04x", bonus: "+4%" },
  { held: "≥ 0.005%", multiplier: "1.08x", bonus: "+8%" },
  { held: "≥ 0.015%", multiplier: "1.10x", bonus: "+10%" },
  { held: "≥ 0.05%", multiplier: "1.12x", bonus: "+12%" },
  { held: "≥ 0.10%", multiplier: "1.15x", bonus: "+15%" },
  { held: "≥ 0.25%", multiplier: "1.17x", bonus: "+17%" },
  { held: "≥ 0.50%", multiplier: "1.19x", bonus: "+19%" },
  { held: "≥ 1.00%", multiplier: "1.20x", bonus: "+20%" },
]

export function Tokens() {
  return (
    <section
      id="tokens"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 md:px-6"
    >
      {/* Token Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {tokens.map((token) => (
          <article
            key={token.name}
            className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-7"
          >
            <div className="flex items-start gap-4">
              <Image
                src={token.img}
                alt={`${token.name} token`}
                width={56}
                height={56}
                className="shrink-0 rounded-full"
              />

              <div>
                <h3
                  className="font-serif text-2xl font-bold"
                  style={{ color: token.accent }}
                >
                  {token.name}
                </h3>

                <p className="mt-1 font-sans text-sm leading-relaxed text-[#b8b6b1]">
                  {token.desc}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#2a2a35] pt-5">
              <div className="space-y-3 font-sans text-sm text-[#b8b6b1]">
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#cd7f32]"
                  />

                  <span>{token.feature}</span>
                </div>

                <div className="flex items-start gap-2 text-[#9ca3af]">
                  <span
                    aria-hidden="true"
                    className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#cd7f32]"
                  />

                  <span>{token.fees}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Smaug supply tier multipliers */}
      <div className="mt-6 rounded-2xl border border-[#2a2a35] bg-[#101017] p-7">
        <h3 className="font-serif text-2xl font-bold text-[#cd7f32]">
          Smaug Supply Tier Multipliers
        </h3>
        <p className="mt-1 font-sans text-sm leading-relaxed text-[#b8b6b1]">
          Holding a larger share of the circulating Smaug supply boosts the
          rewards you earn from both Opus (PLS) and Coda (PLSX).
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="border-b border-[#2a2a35] font-sans text-xs uppercase tracking-wide text-[#9ca3af]">
                <th className="pb-3 pr-4 font-semibold">Circulating Smaug Held</th>
                <th className="pb-3 pr-4 font-semibold">Multiplier</th>
                <th className="pb-3 font-semibold">Reward Bonus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a35]/60">
              {smaugTiers.map((tier) => (
                <tr key={tier.held} className="font-sans text-sm">
                  <td className="py-2.5 pr-4 text-[#b8b6b1]">{tier.held}</td>
                  <td className="py-2.5 pr-4 text-[#e8e6e3]">{tier.multiplier}</td>
                  <td className="py-2.5 font-semibold text-[#cd7f32]">{tier.bonus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 font-sans text-xs text-[#9ca3af]">
          Example: If you hold 0.20% of the circulating Smaug supply, you receive a 15% higher rewards payouts from Opus (rewards PLS) and Coda (rewards PLSX).
        </p>
      </div>
    </section>
  )
}