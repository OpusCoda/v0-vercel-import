"use client"
import { useState } from "react"
import Image from "next/image"
import { ArrowRight, ExternalLink, Copy, Check, ChevronDown } from "lucide-react"
function OrnamentHeading({
  children,
  as: Tag = "h2",
}: {
  children: React.ReactNode
  as?: "h1" | "h2" | "h3"
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="text-[#B87333]/50">&#9670;&mdash;</span>
      <Tag className="text-center font-serif text-xl font-bold text-[#B87333] md:text-2xl">
        {children}
      </Tag>
      <span className="text-[#B87333]/50">&mdash;&#9670;</span>
    </div>
  )
}
const buys = [
  { name: "Buy Opus", img: "/opus-circle.png", accent: "#b1cbdc", href: "#" },
  { name: "Buy Coda", img: "/coda-circle.png", accent: "#b1cbdc", href: "#" },
  { name: "Buy Smaug", img: "/smaug-circle.png", accent: "#b1cbdc", href: "#" },
]
// Token contracts.
const contracts = [
  {
    name: "Opus",
    address: "0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
    url: "https://otter.pulsechain.com/address/0x9B5a65E37f338ADD1263530DDac8CEc56204bB3a",
  },
  {
    name: "Coda",
    address: "0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28",
    url: "https://otter.pulsechain.com/address/0x9F8d74dF6DD3145e858578B0bE1d9B11f41E0A28",
  },
  {
    name: "Smaug",
    address: "0xf4754Aa585caBf38537A68660469A17E203D8632",
    url: "https://otter.pulsechain.com/address/0xf4754Aa585caBf38537A68660469A17E203D8632",
  },
]
// Protocol contracts (staking + the two markets).
const protocolContracts = [
  {
    name: "Smaug Staking",
    address: "0x8Fa4a2f0E465d63C287d4147638d5514bDE2f38D",
    url: "https://otter.pulsechain.com/address/0x8Fa4a2f0E465d63C287d4147638d5514bDE2f38D",
  },
  {
    name: "Probability Shop",
    address: "0x302Ab8bdc02235CB9b428DE1EDA6A978A819B691",
    url: "https://otter.pulsechain.com/address/0x302Ab8bdc02235CB9b428DE1EDA6A978A819B691",
  },
  {
    name: "Wager Market",
    address: "0x6FaE169714ba3BE839332785291f798d627BCE8c",
    url: "https://otter.pulsechain.com/address/0x6FaE169714ba3BE839332785291f798d627BCE8c",
  },
]
// Testing summary per contract — describes the self-testing / AI-review work
// actually performed. Deliberately does NOT claim a formal third-party audit.
const testSummaries: { name: string; items: string[] }[] = [
  {
    name: "Smaug Staking",
    items: [
      "Reward-solvency invariant (property-based fuzzing): across randomized sequences of stake, unstake, claim, reward-notify, and reflection events, the sum of all users' claimable rewards never exceeds the contract's actual token balance — no phantom rewards, no shortfall.",

      "Flash-stake / reflection-timing attack: a user staking immediately before a reflection sweep receives none of the pending reflections — they only earn a pro-rata share of reflections accruing after their stake is active. Confirmed via the sweep-before-modify ordering.",

      "Dual-accumulator consistency: the weighted-reward stream and the principal-proportional reflection stream keep independent, correct bookkeeping through interleaved stake/unstake operations — the class of ordering bug that most often affects multi-reward staking.",

      "Burn-schedule accounting: the 4-week grace period, 5%-per-10-days burn over 200 days, and 50/50 burn-vs-redistribute split were run across all 20 periods with zero residual drift; total burned + redistributed + remaining always equals the original stake.",

      "Idempotency: calling processBurn multiple times within the same 10-day period does not accelerate burning or double-apply.",

      "Rebate bounds (cross-contract): stakingRebateBps was fuzzed across all tiers and interpolated durations and never exceeds its intended maximum (40%), so the Probability Shop's fee-discount math can never underflow.",

      "Reentrancy: the nonReentrant guard blocks re-entry on the PLS and Smaug transfer paths (unstake, claim), verified with a malicious-recipient test.",
    ],
  },
  {
    name: "Probability Shop",
    items: [
      "Solvency invariant: after any sequence of buys, sells, claims, residual claims, and sweeps, the contract's PLS balance always equals its tracked liabilities (pool + bonds + fees + referrals) — verified including partial-claim scenarios where some winners claim and others don't.",

      "90-day unclaimed-funds sweep: after the window, sweepUnclaimed takes only that market's remaining balance, splits it 50% stakers / 50% dev, and decrements the liability by exactly the swept amount. Tested with both partially-claimed and fully-unclaimed markets.",

      "Cross-market isolation: sweeping one market leaves every other market's balance, settlement pool, and claimable amounts completely unchanged — the sweep can never reach another market's funds.",

      "Double-claim guard: the seeder's residual claim and the owner's sweep are mutually exclusive via the residualClaimed flag; attempting the second reverts.",

      "Post-sweep forfeiture: once a market is swept, winners can no longer claim — confirming the forfeiture behaves as intended.",

      "Custom-error conversion: the refactor of require-strings to custom errors (done to fit the contract-size limit) was confirmed logic-identical to the prior version by two independent AI reviews plus a function-and-revert-level diff.",
    ],
  },
  {
    name: "Wager Market",
    items: [
      "Peer-to-peer wager escrow with a dual-vote resolution model: both parties vote, agreement auto-pays the winner, disagreement escalates to an admin arbitration panel (3-of-5).",

      "Nine reviewed security fixes, including: expired-acceptance windows revert instead of trapping the caller's PLS; price-bet wagers don't charge vote deposits; vote deposits are zeroed before external calls; failed transfers revert; the staker fee split is capped to reserve referral capacity; and exact target-price ties escalate to arbitration.",

      "Winnings are paid automatically on resolution (no claim step); referral rewards are claimable via a pull pattern.",
    ],
  },
]
function AddressRow({
  contract,
  copiedId,
  onCopy,
}: {
  contract: { name: string; address: string; url: string }
  copiedId: string | null
  onCopy: (address: string, name: string) => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[#0d0d12]">
      <button
        onClick={() => onCopy(contract.address, contract.name)}
        className="shrink-0 p-1.5 text-[#9ca3af] transition-colors hover:text-[#B87333]"
        title="Copy address"
      >
        {copiedId === contract.name ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
      <a
        href={contract.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <span className="shrink-0 font-mono text-sm text-[#B87333]">{contract.name}:</span>
        <span className="truncate font-mono text-sm text-[#b8b6b1] hover:text-[#e8e6e3]">
          {contract.address}
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-[#9ca3af] transition-colors group-hover:text-[#B87333]" />
      </a>
    </div>
  )
}
export function BuyTokens() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [testsOpen, setTestsOpen] = useState(false)
  const handleCopy = (address: string, contractName: string) => {
    navigator.clipboard.writeText(address)
    setCopiedId(contractName)
    setTimeout(() => setCopiedId(null), 5000)
  }
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <OrnamentHeading>Where to buy</OrnamentHeading>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {buys.map((b) => (
          <a
            key={b.name}
            href={b.href}
            className="group flex items-center justify-between rounded-2xl border border-[#2a2a35] bg-[#101017] px-6 py-5 transition-colors hover:border-[#B87333]/50"
          >
            <span className="flex items-center gap-4">
              <Image src={b.img} alt="" width={44} height={44} className="rounded-full" />
              <span className="flex flex-col">
                <span className="font-serif text-lg font-bold" style={{ color: b.accent }}>
                  {b.name}
                </span>
                <span className="font-sans text-xs text-[#9ca3af]">On PulseX</span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-[#9ca3af] transition-transform group-hover:translate-x-1 group-hover:text-[#B87333]" />
          </a>
        ))}
      </div>
      <div className="mt-16">
        <OrnamentHeading as="h3">Contract addresses</OrnamentHeading>
        <div className="mt-6 space-y-2 rounded-2xl border border-[#2a2a35] bg-[#101017] p-6">
          {/* Token contracts */}
          {contracts.map((contract) => (
            <AddressRow key={contract.name} contract={contract} copiedId={copiedId} onCopy={handleCopy} />
          ))}
          {/* Divider between tokens and protocol contracts */}
          <div className="my-3 flex items-center gap-3 px-3">
            <div className="h-px flex-1 bg-[#2a2a35]" />
            <span className="font-sans text-[10px] uppercase tracking-wider text-[#7c7a76]">
              Protocol
            </span>
            <div className="h-px flex-1 bg-[#2a2a35]" />
          </div>
          {/* Protocol contracts */}
          {protocolContracts.map((contract) => (
            <AddressRow key={contract.name} contract={contract} copiedId={copiedId} onCopy={handleCopy} />
          ))}
        </div>
        {/* Collapsible testing summary */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#2a2a35] bg-[#101017]">
          <button
            onClick={() => setTestsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#0d0d12]"
          >
            <span className="font-serif text-sm font-semibold text-[#B87333]">
              Testing &amp; review summary
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#9ca3af] transition-transform ${testsOpen ? "rotate-180" : ""
                }`}
            />
          </button>
          {testsOpen && (
            <div className="border-t border-[#2a2a35] px-6 py-5">
              <div className="space-y-5">
                {testSummaries.map((c) => (
                  <div key={c.name}>
                    <h4 className="mb-2 font-mono text-sm font-semibold text-[#B87333]">{c.name}</h4>
                    <ul className="space-y-1.5">
                      {c.items.map((item, i) => (
                        <li key={i} className="flex gap-2 font-sans text-xs leading-relaxed text-[#b8b6b1]">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500/70" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}