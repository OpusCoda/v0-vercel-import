import type React from "react"
import "./globals.css"
import { Sacramento, Inter } from "next/font/google"
import localFont from "next/font/local"

const sacramento = Sacramento({
  subsets: ["latin"],
  variable: "--font-sacramento",
  weight: "400",
})

const goudy = localFont({
  src: [
    {
      path: "../public/fonts/GoudyBookletter1911.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-goudy",
  display: "swap",
  fallback: ["Georgia", "serif"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata = {
  title: "Pulsechain Portfolio Tracker",
  description: "Track your Pulsechain assets",
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${goudy.variable} ${sacramento.variable} ${inter.variable}`}>{children}</body>
    </html>
  )
}
