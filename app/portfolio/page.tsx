import { PortfolioDashboard } from "@/components/landing/portfolio-dashboard"
import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"

export const metadata = {
  title: "Portfolio - OpusEco",
  description: "Manage your portfolio and view your positions across Probability Shop and Oath Market",
}

export default function PortfolioPage() {
  return (
    <>
      <SiteNav />
      <PortfolioDashboard />
      <SiteFooter />
    </>
  )
}
