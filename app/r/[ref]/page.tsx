import { redirect } from "next/navigation"

type ReferralRedirectPageProps = {
  params: Promise<{
    ref: string
  }>
}

// /r/<name> is a shareable referral link. It temporarily redirects to
// /?ref=<name>, where ReferralCapture resolves the name, stores the pending
// referrer locally, and cleans the URL. Temporary (not permanent) because this
// is attribution, not a canonical page move.
export default async function ReferralRedirectPage({
  params,
}: ReferralRedirectPageProps) {
  const { ref } = await params
  const normalizedRef = ref.trim().toLowerCase()

  if (!normalizedRef) {
    redirect("/")
  }

  redirect(`/?ref=${encodeURIComponent(normalizedRef)}`)
}