// Full ABI for the OutcomeExchange (Peer-to-peer wager escrow) contract.
// Generated to match the deployed Solidity. Function signatures, structs, and
// enums mirror the contract exactly.
//
// Enums (uint8):
//   WagerType:     0 STANDARD, 1 PRICE_BET
//   Status:        0 Created, 1 Active, 2 Voting, 3 Resolved, 4 Arbitration, 5 Cancelled, 6 Voided
//   DepositWindow: 0 H24, 1 H48, 2 W1, 3 M1
//   Category:      0 Crypto, 1 Politics, 2 Sports, 3 Macro, 4 PulseChain, 5 Misc

export const outcomeExchangeAbi = [
  // ─────────────────────────── Views: counts ───────────────────────────
  {
    type: "function",
    name: "wagerCount",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalWagerCount",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "openWagerCount",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "activeArbitrations",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userWagerCount",
    inputs: [{ type: "address", name: "user" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },

  // ─────────────────────────── Views: enumeration ───────────────────────
  {
    type: "function",
    name: "getOpenWagers",
    inputs: [],
    outputs: [{ type: "uint256[]", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWagersPaginated",
    inputs: [
      { type: "uint256", name: "start" },
      { type: "uint256", name: "count" },
    ],
    outputs: [{ type: "uint256[]", name: "ids" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserWagers",
    inputs: [
      { type: "address", name: "user" },
      { type: "uint256", name: "start" },
      { type: "uint256", name: "count" },
    ],
    outputs: [{ type: "uint256[]", name: "ids" }],
    stateMutability: "view",
  },

  // ─────────────────────────── Views: wager detail ──────────────────────
  {
    type: "function",
    name: "getWagerDetails",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [
      {
        type: "tuple",
        name: "wager",
        components: [
          { type: "uint8", name: "wagerType" },
          { type: "uint8", name: "category" },
          { type: "address", name: "creator" },
          { type: "address", name: "challenger" },
          { type: "uint256", name: "creatorStake" },
          { type: "uint256", name: "challengerStake" },
          { type: "uint256", name: "creatorVoteDeposit" },
          { type: "uint256", name: "challengerVoteDeposit" },
          { type: "string", name: "description" },
          { type: "uint256", name: "eventDate" },
          { type: "uint256", name: "depositDeadline" },
          { type: "uint256", name: "votingDeadline" },
          { type: "uint8", name: "status" },
          { type: "address", name: "creatorVote" },
          { type: "address", name: "challengerVote" },
          { type: "address", name: "winner" },
        ],
      },
      {
        type: "tuple",
        name: "priceBet",
        components: [
          { type: "bytes32", name: "queryId" },
          { type: "uint256", name: "targetPrice" },
          { type: "bool", name: "creatorBetsAbove" },
        ],
      },
      { type: "bool", name: "creatorRequestedVoid" },
      { type: "bool", name: "challengerRequestedVoid" },
      { type: "uint256", name: "arbitrationStart" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getArbitrationStatus",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [
      { type: "address[]", name: "arbitrators" },
      { type: "address[]", name: "votes" },
      { type: "uint256", name: "creatorVotes" },
      { type: "uint256", name: "challengerVotes" },
      { type: "uint256", name: "startedAt" },
      { type: "uint256", name: "expiresAt" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "requiredAcceptanceAmount",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [
      { type: "uint256", name: "stake" },
      { type: "uint256", name: "voteDeposit" },
      { type: "uint256", name: "totalRequired" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "quoteWager",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [
      { type: "uint256", name: "totalPot" },
      { type: "uint256", name: "creatorFee" },
      { type: "uint256", name: "challengerFee" },
      { type: "uint256", name: "winnerPayout" },
    ],
    stateMutability: "view",
  },

  // ─────────────────────────── Views: user info ─────────────────────────
  {
    type: "function",
    name: "getReputation",
    inputs: [{ type: "address", name: "user" }],
    outputs: [
      {
        type: "tuple",
        name: "",
        components: [
          { type: "uint256", name: "wagersCreated" },
          { type: "uint256", name: "wagersWon" },
          { type: "uint256", name: "wagersLost" },
          { type: "uint256", name: "wagersDisputed" },
          { type: "uint256", name: "correctVotes" },
          { type: "uint256", name: "incorrectVotes" },
          { type: "uint256", name: "noVotes" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReferralInfo",
    inputs: [{ type: "address", name: "user" }],
    outputs: [
      { type: "address", name: "referredByAddr" },
      { type: "uint256", name: "startTime" },
      { type: "bool", name: "isActive" },
      { type: "uint256", name: "expiresAt" },
      { type: "uint256", name: "discountBps" },
      { type: "uint256", name: "pendingRewards" },
      { type: "uint256", name: "peopleReferred" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserFeeInfo",
    inputs: [{ type: "address", name: "user" }],
    outputs: [
      { type: "uint256", name: "baseFeeBps" },
      { type: "uint256", name: "stakingRebate" },
      { type: "uint256", name: "referralRebate" },
      { type: "uint256", name: "effectiveFeeBps" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "protocolFeeAccrued",
    inputs: [{ type: "address", name: "" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isArbitrator",
    inputs: [{ type: "address", name: "" }],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryIdLabel",
    inputs: [{ type: "bytes32", name: "queryId" }],
    outputs: [{ type: "string", name: "" }],
    stateMutability: "pure",
  },

  // ─────────────────────────── Writes: create ───────────────────────────
  {
    type: "function",
    name: "createWager",
    inputs: [
      { type: "address", name: "challenger" },
      { type: "string", name: "description" },
      { type: "uint256", name: "eventDate" },
      { type: "uint8", name: "depositWindow" },
      { type: "uint256", name: "challengerStake" },
      { type: "uint8", name: "category" },
      { type: "address", name: "referrer" },
    ],
    outputs: [{ type: "uint256", name: "wagerId" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "createPriceBet",
    inputs: [
      { type: "address", name: "challenger" },
      { type: "string", name: "description" },
      { type: "uint256", name: "eventDate" },
      { type: "uint8", name: "depositWindow" },
      { type: "uint256", name: "challengerStake" },
      { type: "bytes32", name: "queryId" },
      { type: "uint256", name: "targetPrice" },
      { type: "bool", name: "creatorBetsAbove" },
      { type: "uint8", name: "category" },
      { type: "address", name: "referrer" },
    ],
    outputs: [{ type: "uint256", name: "wagerId" }],
    stateMutability: "payable",
  },

  // ─────────────────────────── Writes: lifecycle ────────────────────────
  {
    type: "function",
    name: "acceptWager",
    inputs: [
      { type: "uint256", name: "wagerId" },
      { type: "address", name: "referrer" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "resolvePriceBet",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitVote",
    inputs: [
      { type: "uint256", name: "wagerId" },
      { type: "address", name: "winner" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "proposeEarlyResolution",
    inputs: [
      { type: "uint256", name: "wagerId" },
      { type: "address", name: "winner" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "escalateToArbitration",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "castArbitrationVote",
    inputs: [
      { type: "uint256", name: "wagerId" },
      { type: "address", name: "winner" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelWager",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "voidWager",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "expireArbitration",
    inputs: [{ type: "uint256", name: "wagerId" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFees",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimReferralRewards",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ─────────────────────────── Events (subset) ──────────────────────────
  {
    type: "event",
    name: "WagerCreated",
    inputs: [
      { type: "uint256", name: "wagerId", indexed: true },
      { type: "uint8", name: "wagerType", indexed: false },
      { type: "uint8", name: "category", indexed: false },
      { type: "address", name: "creator", indexed: true },
      { type: "address", name: "challenger", indexed: true },
      { type: "uint256", name: "creatorStake", indexed: false },
      { type: "uint256", name: "challengerStake", indexed: false },
      { type: "string", name: "description", indexed: false },
      { type: "uint256", name: "eventDate", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WagerAccepted",
    inputs: [
      { type: "uint256", name: "wagerId", indexed: true },
      { type: "address", name: "challenger", indexed: true },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WagerResolved",
    inputs: [
      { type: "uint256", name: "wagerId", indexed: true },
      { type: "address", name: "winner", indexed: true },
      { type: "uint256", name: "payout", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WagerArbitrated",
    inputs: [
      { type: "uint256", name: "wagerId", indexed: true },
      { type: "address", name: "winner", indexed: true },
      { type: "uint256", name: "payout", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WagerEscalated",
    inputs: [{ type: "uint256", name: "wagerId", indexed: true }],
    anonymous: false,
  },
  {
    type: "event",
    name: "ArbitrationVoteCast",
    inputs: [
      { type: "uint256", name: "wagerId", indexed: true },
      { type: "address", name: "arbitrator", indexed: true },
      { type: "address", name: "proposedWinner", indexed: true },
    ],
    anonymous: false,
  },
] as const