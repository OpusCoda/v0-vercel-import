export type ProtocolType = "probability-shop" | "outcome-exchange"

export type PositionStatus =
  | "open"
  | "active"
  | "awaiting-action"
  | "voting"
  | "arbitration"
  | "resolved"
  | "voided"
  | "cancelled"

export type UserRole = "creator" | "challenger" | "yes" | "no"

export type ActionType =
  | "accept"
  | "vote"
  | "resolve-price"
  | "escalate"
  | "claim"
  | "refund"
  | "withdraw-fees"

export interface UserPositionAction {
  type: ActionType
  label: string
}

export interface UserPositionItem {
  id: string
  protocol: ProtocolType
  title: string
  category: string
  status: PositionStatus
  role?: UserRole
  lockedPls: bigint
  claimablePls: bigint
  eventTimestamp?: number
  action?: UserPositionAction
  result?: "won" | "lost" | "voided"
}

export interface PortfolioMetrics {
  lockedValuePls: bigint
  pendingActionsCount: number
  claimablePls: bigint
  performance: {
    wins: number
    losses: number
    percentage: number
  }
}

export function calculateMetrics(
  positions: UserPositionItem[]
): PortfolioMetrics {
  const lockedValuePls = positions.reduce(
    (sum, item) => sum + item.lockedPls,
    0n
  )

  const claimablePls = positions.reduce(
    (sum, item) => sum + item.claimablePls,
    0n
  )

  const pendingActionsCount = positions.filter(
    (item) => item.action !== undefined
  ).length

  const resolved = positions.filter((item) => item.result !== undefined)
  const wins = resolved.filter((item) => item.result === "won").length
  const losses = resolved.filter((item) => item.result === "lost").length
  const total = wins + losses
  const percentage = total > 0 ? Math.round((wins / total) * 100) : 0

  return {
    lockedValuePls,
    pendingActionsCount,
    claimablePls,
    performance: {
      wins,
      losses,
      percentage,
    },
  }
}
