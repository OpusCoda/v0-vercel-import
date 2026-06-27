import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export function ComingSoon({
  title,
  accent,
  description,
  Icon,
}: {
  title: string
  accent: string
  description: string
  Icon: LucideIcon
}) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center md:px-6">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#2a2a35] bg-[#101017]"
        style={{ boxShadow: `0 0 40px -12px ${accent}` }}
      >
        <Icon className="h-9 w-9" style={{ color: accent }} aria-hidden />
      </div>

      <h1 className="mt-8 text-balance font-serif text-4xl font-bold text-[#e8e6e3] md:text-5xl">{title}</h1>

      <span
        className="mt-4 rounded-full border px-3 py-1 font-sans text-xs font-semibold tracking-[0.15em]"
        style={{ borderColor: `${accent}55`, color: accent }}
      >
        COMING SOON
      </span>

      <p className="mt-6 max-w-md text-pretty font-sans text-base leading-relaxed text-[#b8b6b1]">{description}</p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 font-sans text-sm text-[#9ca3af] transition-colors hover:text-[#d4af37]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </section>
  )
}
