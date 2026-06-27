import Image from "next/image"

const tokens = [
  {
    name: "Opus",
    img: "/opus-circle.png",
    accent: "#d4af37",
    desc: "Stake PLS reflections for holding Opus.",
    circulating: "8,421,337,104",
    tax: "1%",
  },
  {
    name: "Coda",
    img: "/coda-circle.png",
    accent: "#c0c4cc",
    desc: "Earn PLSX reflections for holding Coda.",
    circulating: "3,337,742,298",
    tax: "1%",
  },
  {
    name: "Smaug",
    img: "/smaug-circle.png",
    accent: "#cd7f32",
    desc: "The deflationary token with staking rewards.",
    circulating: "17,812,554,227",
    tax: "1%",
  },
]

export function Tokens() {
  return (
    <section id="tokens" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 md:px-6">
      <div className="grid gap-6 md:grid-cols-3">
        {tokens.map((token) => (
          <article key={token.name} className="rounded-2xl border border-[#2a2a35] bg-[#101017] p-7">
            <div className="flex items-center gap-4">
              <Image
                src={token.img || "/placeholder.svg"}
                alt={`${token.name} token`}
                width={56}
                height={56}
                className="rounded-full"
              />
              <div>
                <h3 className="font-serif text-2xl font-bold" style={{ color: token.accent }}>
                  {token.name}
                </h3>
                <p className="mt-1 font-sans text-sm text-[#b8b6b1]">{token.desc}</p>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between border-t border-[#2a2a35] pt-5">
              <div>
                <div className="font-serif text-xl font-bold text-[#e8e6e3]">{token.circulating}</div>
                <div className="font-sans text-[11px] tracking-[0.1em] text-[#9ca3af]">CIRCULATING</div>
              </div>
              <div className="text-right">
                <div className="font-serif text-xl font-bold text-[#e8e6e3]">{token.tax}</div>
                <div className="font-sans text-[11px] tracking-[0.1em] text-[#9ca3af]">TAX</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
