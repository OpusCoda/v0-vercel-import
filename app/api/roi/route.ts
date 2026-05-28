import { getOpusRoi, getCodaRoi, getSmaugRoi } from "@/app/actions"

export const dynamic = "force-dynamic"

export async function GET() {
  const [opus, coda, smaug] = await Promise.all([getOpusRoi(), getCodaRoi(), getSmaugRoi()])

  return Response.json({
    opus: {
      roi24h: opus.roi24h ?? null,
      roi7d: opus.roi7d ?? null,
      roi30d: opus.roi30d ?? null,
    },
    coda: {
      roi24h: coda.roi24h ?? null,
      roi7d: coda.roi7d ?? null,
      roi30d: coda.roi30d ?? null,
    },
    smaug: {
      roi24h: smaug.roi24h ?? null,
      roi7d: smaug.roi7d ?? null,
      roi30d: smaug.roi30d ?? null,
    },
    description: "ROI % = rewards earned in period (USD) / token holding value at period start (USD) × 100. Based on a 100,000 Opus, 100,000,000 Coda, and 100,000 Smaug reference holding.",
    updatedAt: new Date().toISOString(),
  })
}
