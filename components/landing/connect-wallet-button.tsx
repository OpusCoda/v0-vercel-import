"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"

export function ConnectWalletButton({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain

        const base =
          "rounded-md px-5 py-2.5 font-sans text-sm font-semibold transition-colors"
        const gold = "bg-[#d4af37] text-[#0a0a0c] hover:bg-[#c19b2e]"
        const width = fullWidth ? "w-full" : ""

        return (
          <div
            className={fullWidth ? "w-full" : ""}
            aria-hidden={!ready}
            style={!ready ? { opacity: 0, pointerEvents: "none", userSelect: "none" } : undefined}
          >
            {(() => {
              if (!connected) {
                return (
                  <button type="button" onClick={openConnectModal} className={`${base} ${gold} ${width}`}>
                    Connect Wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    type="button"
                    onClick={openChainModal}
                    className={`${base} ${width} bg-[#b91c1c] text-[#f5f5f4] hover:bg-[#991b1b]`}
                  >
                    Wrong network
                  </button>
                )
              }

              return (
                <button
                  type="button"
                  onClick={openAccountModal}
                  className={`${base} ${width} border border-[#d4af37]/40 bg-[#12121a] text-[#e8e6e3] hover:border-[#d4af37]`}
                >
                  {account.displayName}
                </button>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
