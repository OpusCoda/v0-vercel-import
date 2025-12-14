import type React from "react"
import "./globals.css"
import { Sacramento, Inter, Merriweather } from "next/font/google"
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap');

const sacramento = Sacramento({
  subsets: ["latin"],
  variable: "--font-sacramento",
  weight: "400",
})

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-goudy",
  weight: ["400", "700"],
  display: "swap",
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
      <body className={`${merriweather.variable} ${sacramento.variable} ${inter.variable}`}>{children}</body>
    </html>
  )
}
