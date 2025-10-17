"use client"
import { useState, useEffect } from "react"

interface ValidatorData {
  index: string
  balance: number
  status: string
  effectiveBalance: number
}

export default function ValidatorInfo({ validatorId }: { validatorId: string }) {
  const [data, setData] = useState<ValidatorData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] Fetching validator data for validatorId:", validatorId)

    if (!validatorId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/api?validatorId=${validatorId}`)
      .then((res) => {
        console.log("[v0] API response status:", res.status)
        return res.json()
      })
      .then((result) => {
        console.log("[v0] API response data:", result)
        if (result.error) throw new Error(result.error)

        const validatorData: ValidatorData = {
          index: result.data?.index || result.index || validatorId,
          balance: result.data?.balance ? Number(result.data.balance) / 1e9 : result.balance || 0,
          status: result.data?.status || result.status || "Unknown",
          effectiveBalance: result.data?.effective_balance
            ? Number(result.data.effective_balance) / 1e9
            : result.effectiveBalance || 0,
        }

        console.log("[v0] Parsed validator data:", validatorData)
        setData(validatorData)
      })
      .catch((err) => {
        console.error("[v0] Error fetching validator data:", err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [validatorId])

  if (!validatorId) return null
  if (loading) return <p className="text-sm text-[#a1a1aa]">Loading validator #{validatorId}...</p>
  if (error)
    return (
      <p className="text-sm text-red-500">
        Error loading validator #{validatorId}: {error}
      </p>
    )
  if (!data) return <p className="text-sm text-[#a1a1aa]">No data available for validator #{validatorId}</p>

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-[#a1a1aa]">Validator #{data.index}</span>
        <span
          className={`text-xs px-2 py-1 rounded ${
            data.status === "active_ongoing" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
          }`}
        >
          {data.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[#71717a]">Balance</p>
          <p className="font-mono text-white">
            {data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLS
          </p>
        </div>
        <div>
          <p className="text-[#71717a]">Effective Balance</p>
          <p className="font-mono text-white">
            {data.effectiveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            PLS
          </p>
        </div>
      </div>
    </div>
  )
}
