import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { EarnDashboard } from "@/components/landing/earn-dashboard"
import { WalletContextPrompt } from '@/components/wallet-context-prompt'

export const metadata = {
  title: "Earn - OpusEco",
  description: "Stake Smaug to earn PLS, PLSX, and Coda rewards",
}

export default function EarnPage() {
  return (
    <>
      <SiteNav />
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <WalletContextPrompt />
      </div>
      <EarnDashboard />
      <SiteFooter />
    </>
  )
}