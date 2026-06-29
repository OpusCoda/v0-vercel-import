import { Sprout } from "lucide-react"
import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { ComingSoon } from "@/components/landing/coming-soon"

export default function EarnPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      <ComingSoon
        title="Stake Smaug"
        accent="#3fbf6f"
        Icon={Sprout}
        description="Stake Smaug to earn PLS, PLSX, and Coda rewards. The longer you stake, the greater your power in the ecosystem."
      />
      <SiteFooter />
    </main>
  )
}
