import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { ReferralsDashboard } from "@/components/landing/referrals-dashboard"

export const metadata = {
  title: "Referrals · The Opus Ecosystem",
  description: "Claim a referral name, share your link, and earn a share of protocol fees on PulseChain.",
}

export default function ReferralsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      <div className="pt-24 md:pt-28">
        <ReferralsDashboard />
      </div>
      <SiteFooter />
    </main>
  )
}
