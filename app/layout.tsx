import type React from "react"
import "./globals.css"
import { Sacramento, Inter, Merriweather, Roboto } from "next/font/google"

const sacramento = Sacramento({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sacramento",
})

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-serif",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-roboto",
})

export const metadata = {
  title: "Pulsechain Portfolio Tracker",
  description: "Track your Pulsechain assets",
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${merriweather.variable} ${sacramento.variable} ${inter.variable} ${roboto.variable}`}
      >
        {children}
      </body>
    </html>
  )
}
