import { Globe } from "lucide-react"
import { SiteNav } from "@/components/landing/site-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { ComingSoon } from "@/components/landing/coming-soon"

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c]">
      <SiteNav />
      <ComingSoon
        title="Prediction Markets"
        accent="#4a90d9"
        Icon={Globe}
        description="Trade on real-world outcomes in the Probability Shop. Buy YES or NO and earn if you're right."
      />
      <SiteFooter />
    </main>
  )
}
