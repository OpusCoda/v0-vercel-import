"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Check, Copy, Link2, Users, Gift, Percent, Layers, Clock } from "lucide-react"
import { ConnectWalletButton } from "@/components/landing/connect-wallet-button"
import { registerReferralName, getReferralStats } from "@/app/actions"
import { buildReferralLink, getPendingReferrer } from "@/lib/referral"

const NAME_PATTERN = /^[a-z0-9-]{3,20}$/

function OrnamentHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="text-[#d4af37]/50">&#9670;&mdash;</span>
      <h2 className="text-center font-serif text-xl font-bold text-[#d4af37] md:text-2xl">{children}</h2>
      <span className="text-[#d4af37]/50">&mdash;&#9670;</span>
    </div>
  )
}

type Stats = {
  name: string | null
  referredBy: { referrer_wallet: string; referrer_name: string | null } | null
  referralCount: number
}

export function ReferralsDashboard() {
  const { address, isConnected } = useAccount()

  const [nameInput, setNameInput] = useState("")
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pendingRef, setPendingRef] = useState<string | null>(null)

  // Live client-side validation mirror of the server rules.
  const trimmed = nameInput.trim().toLowerCase()
  const validFormat = NAME_PATTERN.test(trimmed)

  const loadStats = async (addr: string) => {
    setLoadingStats(true)
    try {
      const res = await getReferralStats(addr)
      if (res.success) {
        setStats({ name: res.name, referredBy: res.referredBy, referralCount: res.referralCount })
      }
    } catch (err) {
      console.error("[v0] Error loading referral stats:", err)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      loadStats(address)
    } else {
      setStats(null)
    }
  }, [isConnected, address])

  useEffect(() => {
    const pending = getPendingReferrer()
    if (pending) setPendingRef(pending.ref)
  }, [])

  const handleRegister = async () => {
    if (!address) return
    setError(null)
    setRegistering(true)
    try {
      const res = await registerReferralName(trimmed, address)
      if (res.success) {
        setNameInput("")
        await loadStats(address)
      } else {
        setError(res.error ?? "Failed to register name.")
      }
    } catch (err) {
      console.error("[v0] Error registering name:", err)
      setError("Failed to register name.")
    } finally {
      setRegistering(false)
    }
  }

  const referralLink = stats?.name ? buildReferralLink(stats.name) : ""

  const handleCopy = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
      <OrnamentHeading>Refer friends, earn together</OrnamentHeading>
      <p className="mx-auto mt-4 max-w-2xl text-pretty text-center font-sans text-base leading-relaxed text-[#b8b6b1]">
        Claim a referral name, share your link, and earn a share of protocol fees when the people you invite use Oath
        Vault and the Probability Shop. Your friends get a fee discount too.
      </p>

      {pendingRef && (
        <p className="mx-auto mt-4 max-w-2xl rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/5 px-4 py-3 text-center font-sans text-sm text-[#d4af37]">
          You were referred by <span className="font-semibold">{pendingRef}</span>. This will be linked on your first
          protocol interaction once contracts are live.
        </p>
      )}

      {/* Claim / manage name */}
      <div className="mt-12 rounded-2xl border border-[#2a2a35] bg-[#101017] p-6 md:p-8">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="font-sans text-sm text-[#b8b6b1]">Connect your wallet to claim a referral name.</p>
            <ConnectWalletButton />
          </div>
        ) : loadingStats ? (
          <p className="py-4 text-center font-sans text-sm text-[#9ca3af]">Loading your referral profile…</p>
        ) : stats?.name ? (
          <div>
            <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.15em] text-[#9ca3af]">
              <Link2 className="h-4 w-4 text-[#d4af37]" aria-hidden />
              Your referral link
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-4 py-3 font-mono text-sm text-[#e8e6e3]">
                {referralLink}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#d4af37] px-5 py-3 font-sans text-sm font-semibold text-[#0a0a0c] transition-colors hover:bg-[#c19b2e]"
              >
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-3 font-sans text-sm text-[#9ca3af]">
              Referral name: <span className="font-semibold text-[#d4af37]">{stats.name}</span>
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="referral-name" className="font-sans text-sm font-semibold text-[#e8e6e3]">
              Claim your referral name
            </label>
            <p className="mt-1 font-sans text-xs text-[#9ca3af]">
              3–20 characters · lowercase letters, numbers, and hyphens only. One name per wallet, permanent.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center rounded-lg border border-[#2a2a35] bg-[#0a0a0c] px-3">
                <span className="font-mono text-sm text-[#7c7a76]">/?ref=</span>
                <input
                  id="referral-name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value)
                    setError(null)
                  }}
                  placeholder="your-name"
                  autoComplete="off"
                  className="w-full bg-transparent px-1 py-3 font-mono text-sm text-[#e8e6e3] outline-none placeholder:text-[#5c5a56]"
                />
              </div>
              <button
                type="button"
                onClick={handleRegister}
                disabled={!validFormat || registering}
                className="rounded-lg bg-[#d4af37] px-6 py-3 font-sans text-sm font-semibold text-[#0a0a0c] transition-colors hover:bg-[#c19b2e] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {registering ? "Claiming…" : "Claim name"}
              </button>
            </div>
            {nameInput && !validFormat && (
              <p className="mt-2 font-sans text-xs text-[#e06a5e]">
                Name must be 3–20 characters using lowercase letters, numbers, or hyphens.
              </p>
            )}
            {error && <p className="mt-2 font-sans text-xs text-[#e06a5e]">{error}</p>}
          </div>
        )}
      </div>

      {/* Stats */}
      {isConnected && stats && (
        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#2a2a35] sm:grid-cols-3">
          <div className="flex items-center gap-4 bg-[#0d0d12] px-6 py-7">
            <Users className="h-8 w-8 text-[#d4af37]" aria-hidden />
            <span className="flex flex-col">
              <span className="font-sans text-[11px] tracking-[0.12em] text-[#9ca3af]">PEOPLE REFERRED</span>
              <span className="mt-1 font-serif text-2xl font-bold text-[#e8e6e3]">{stats.referralCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-4 bg-[#0d0d12] px-6 py-7">
            <Gift className="h-8 w-8 text-[#d4af37]" aria-hidden />
            <span className="flex flex-col">
              <span className="font-sans text-[11px] tracking-[0.12em] text-[#9ca3af]">FEES EARNED</span>
              <span className="mt-1 font-serif text-2xl font-bold text-[#e8e6e3]">—</span>
              <span className="mt-0.5 font-sans text-xs text-[#7c7a76]">Pending protocol launch</span>
            </span>
          </div>
          <div className="flex items-center gap-4 bg-[#0d0d12] px-6 py-7">
            <Percent className="h-8 w-8 text-[#d4af37]" aria-hidden />
            <span className="flex flex-col">
              <span className="font-sans text-[11px] tracking-[0.12em] text-[#9ca3af]">REFERRED BY</span>
              <span className="mt-1 font-serif text-lg font-bold text-[#e8e6e3]">
                {stats.referredBy ? stats.referredBy.referrer_name ?? "A wallet" : "—"}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Fee model explainer */}
      <div className="mt-12">
        <OrnamentHeading>How referral rewards work</OrnamentHeading>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[
            {
              Icon: Percent,
              title: "20% fee discount for your invitees",
              body: "Anyone who joins through your link pays 20% lower protocol fees on Oath Vault wagers and Probability Shop trades.",
            },
            {
              Icon: Gift,
              title: "10% referral reward",
              body: "You earn 10% of every protocol fee your invitee pays, paid instantly in PLS.",
            },
            {
              Icon: Layers,
              title: "Stacking capped at 50%",
              body: "Combined discounts and bonuses from referrals and Smaug staking are capped at 50%.",
            },
            {
              Icon: Clock,
              title: "12-month reward window",
              body: "You earn referral rewards from each invitee's activity for 12 months after they bind to your link.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-2xl border border-[#2a2a35] bg-[#101017] p-6">
              <item.Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#d4af37]" aria-hidden />
              <div>
                <p className="font-sans text-sm font-semibold text-[#e8e6e3]">{item.title}</p>
                <p className="mt-1 font-sans text-sm leading-relaxed text-[#b8b6b1]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-pretty text-center font-sans text-xs leading-relaxed text-[#7c7a76]">
          The referral name registry and your link are live now. Fee discounts, PLS reward payouts, and the immutable
          on-chain referrer binding activate when the Oath Vault and Probability Shop contracts deploy.
        </p>
      </div>
    </section>
  )
}
