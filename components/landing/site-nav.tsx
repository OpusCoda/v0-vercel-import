"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { BookOpen, Menu, X } from "lucide-react"
import { ConnectWalletButton } from "./connect-wallet-button"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Earn", href: "/earn" },
  { label: "Markets", href: "/markets" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tokens", href: "/tokens" },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#2a2a35] bg-[#0a0a0c]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/favicon-96x96.png"
            alt="Opus emblem"
            width={44}
            height={44}
            className="rounded-full ring-1 ring-[#d4af37]/40"
          />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-bold tracking-[0.18em] text-[#e8e6e3]">OPUS</span>
            <span className="font-sans text-[11px] tracking-wide text-[#9ca3af]"></span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-sans text-sm text-[#cfcdc8] transition-colors hover:text-[#d4af37]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="#docs"
            aria-label="Documentation"
            className="hidden items-center gap-2 text-[#9ca3af] transition-colors hover:text-[#d4af37] sm:flex"
          >
            <BookOpen className="h-5 w-5" />
            <span className="font-sans text-sm">Docs</span>
          </Link>
          <div className="hidden sm:block">
            <ConnectWalletButton />
          </div>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="text-[#e8e6e3] md:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-[#2a2a35] px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 font-sans text-sm text-[#cfcdc8] transition-colors hover:bg-[#12121a] hover:text-[#d4af37]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <ConnectWalletButton fullWidth />
          </div>
        </nav>
      )}
    </header>
  )
}
