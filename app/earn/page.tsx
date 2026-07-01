import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { EarnDashboard } from "@/components/landing/earn-dashboard"

export const metadata = {
  title: "Earn - OpusEco",
  description: "Stake Smaug to earn PLS, PLSX, and Coda rewards",
}

export default function EarnPage() {
  return (
    <>
      <SiteNav />
      <EarnDashboard />
      <SiteFooter />
    </>
  )
}
