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
    </section>
  )
}