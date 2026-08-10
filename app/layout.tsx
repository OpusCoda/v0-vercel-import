import type React from "react"
import "./globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import { Spectral, Fraunces } from "next/font/google"
import { TopBar } from "@/components/top-bar"
import { Providers } from "@/components/providers"
import { ReferralCapture } from "@/components/referral-capture"

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-serif",
})

export const metadata = {
  title: "The Opus Ecosystem",
  description: "The Opus Ecosystem on PulseChain",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "OpusCoda",
  },
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${spectral.variable}`}>
        <Providers>
          <ReferralCapture />
          <TopBar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
