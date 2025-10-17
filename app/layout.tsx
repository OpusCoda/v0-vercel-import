import type React from "react"
import "./globals.css"

export const metadata = {
  title: "Pulsechain Portfolio Tracker",
  description: "Track your Pulsechain assets",
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link href="https://unpkg.com/nes.css@latest/css/nes.min.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
