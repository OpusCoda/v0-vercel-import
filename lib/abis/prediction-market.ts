export const predictionMarketAbi = [
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAdmin",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createMarket",
    inputs: [
      { type: "string", name: "question" },
      { type: "string", name: "resolutionCriteria" },
      { type: "string", name: "source" },
      { type: "uint8", name: "category" },
      { type: "uint256", name: "bettingDeadline" },
      { type: "uint256", name: "resolutionDeadline" },
      { type: "uint256", name: "seedPerSide" },
    ],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "payable",
  },
  // ─── Add to predictionMarketAbi (before the closing `] as const`) ───

  {
    type: "function",
    name: "addAdmin",
    inputs: [{ type: "address", name: "account" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeAdmin",
    inputs: [{ type: "address", name: "account" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "marketCount",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
  // ─── Add these entries to the predictionMarketAbi array ───

  {
    type: "function",
    name: "getStatus",
    inputs: [{ type: "uint256", name: "marketId" }],
    outputs: [{ type: "uint8", name: "" }], // enum Status: 0 Betting, 1 AwaitingResolution, 2 ChallengeWindow, 3 Resolved, 4 Voided
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProposal",
    inputs: [{ type: "uint256", name: "marketId" }],
    outputs: [
      { type: "address", name: "proposer" },
      { type: "bool", name: "proposedOutcome" },
      { type: "uint256", name: "proposalTime" },
      { type: "uint256", name: "expiresAt" },
      { type: "bool", name: "disputed" },
      { type: "uint256", name: "disputerCount" },
      { type: "uint256", name: "totalBondsAtStake" },
    ],
    stateMutability: "view",
  },
  // ─── REPLACE the existing (incorrect) getMarket entry with this ───
  // Full 32-field Market struct, confirmed against live getMarket(0) output.
  {
    type: "function",
    name: "getMarket",
    inputs: [{ type: "uint256", name: "marketId" }],
    outputs: [
      {
        type: "tuple",
        name: "",
        components: [
          { type: "string",  name: "question" },
          { type: "string",  name: "resolutionCriteria" },
          { type: "string",  name: "source" },
          { type: "uint8",   name: "category" },
          { type: "address", name: "creator" },
          { type: "uint256", name: "bettingDeadline" },
          { type: "uint256", name: "resolutionDeadline" },
          { type: "bool",    name: "resolved" },
          { type: "bool",    name: "outcome" },
          { type: "bool",    name: "voided" },
          { type: "uint256", name: "resolvedAt" },
          { type: "uint256", name: "yesPool" },
          { type: "uint256", name: "noPool" },
          { type: "uint256", name: "seedLiquidity" },
          { type: "uint256", name: "totalYesShares" },
          { type: "uint256", name: "totalNoShares" },
          { type: "uint256", name: "totalVolume" },
          { type: "uint256", name: "uniqueTraders" },
          { type: "address", name: "proposer" },
          { type: "bool",    name: "proposedOutcome" },
          { type: "uint256", name: "proposalTime" },
          { type: "uint256", name: "proposalBond" },
          { type: "bool",    name: "proposalActive" },
          { type: "bool",    name: "disputed" },
          { type: "uint256", name: "proposalId" },
          { type: "bool",    name: "seedRecouped" },
          { type: "uint256", name: "totalNetCollateral" },
          { type: "uint256", name: "settlementPool" },
          { type: "uint256", name: "remainingSettlementPool" },
          { type: "uint256", name: "remainingMarketBalance" },
          { type: "uint256", name: "claimedWinningShares" },
          { type: "bool",    name: "residualClaimed" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // Also ensure getStatus is present (needed to label market state):
  {
    type: "function",
    name: "getStatus",
    inputs: [{ type: "uint256", name: "marketId" }],
    outputs: [{ type: "uint8", name: "" }], // 0 Betting,1 AwaitingResolution,2 ChallengeWindow,3 Resolved,4 Voided
    stateMutability: "view",
  },
] as const
