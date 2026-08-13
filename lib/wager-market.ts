export const WAGER_MARKET_ADDRESS = '0x6FaE169714ba3BE839332785291f798d627BCE8c' as const
// enum DepositWindow { H24, H48, W1, M1 }
export const DEPOSIT_WINDOWS = [
  { value: 0, label: '24 hours' },
  { value: 1, label: '48 hours' },
  { value: 2, label: '1 week' },
  { value: 3, label: '1 month' },
] as const
// enum Category { Crypto, Politics, Sports, Macro, PulseChain, Misc }
export const CATEGORIES = [
  { value: 0, label: 'Crypto' },
  { value: 1, label: 'Politics' },
  { value: 2, label: 'Sports' },
  { value: 3, label: 'Macro' },
  { value: 4, label: 'PulseChain' },
  { value: 5, label: 'Misc' },
] as const
// -----------------------------------------------------------------------------
// NOTE: price bets and the Fetch Oracle were removed from the contract. Price
// questions are now created as ordinary wagers, resolved by the two parties'
// votes. The QUERY_* constants and PRICE_BET_TOKENS list are gone with them.
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// ABI — subset matching the DEPLOYED contract.
// -----------------------------------------------------------------------------
export const WAGER_MARKET_ABI = [
  {
    inputs: [
      { name: 'challenger', type: 'address' },
      { name: 'description', type: 'string' },
      { name: 'eventDate', type: 'uint256' },
      { name: 'depositWindow', type: 'uint8' },
      { name: 'challengerStake', type: 'uint256' },
      { name: 'category', type: 'uint8' },
      { name: 'referrer', type: 'address' },
    ],
    name: 'createWager',
    outputs: [{ name: 'wagerId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'wagerId', type: 'uint256' },
      { name: 'referrer', type: 'address' },
    ],
    name: 'acceptWager',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'wagerId', type: 'uint256' },
      { name: 'winner', type: 'address' },
    ],
    name: 'submitVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'wagerId', type: 'uint256' },
      { name: 'winner', type: 'address' },
    ],
    name: 'proposeEarlyResolution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'escalateToArbitration',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'wagerId', type: 'uint256' },
      { name: 'winner', type: 'address' },
    ],
    name: 'castArbitrationVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'expireArbitration',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'cancelWager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'voidWager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ── Fee / referral withdrawals ──
  {
    inputs: [],
    name: 'withdrawFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimReferralRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'protocolFeeAccrued',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'referralRewards',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getReferralInfo',
    outputs: [
      { name: 'referredByAddr', type: 'address' },
      { name: 'startTime', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'discountBps', type: 'uint256' },
      { name: 'pendingRewards', type: 'uint256' },
      { name: 'peopleReferred', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // ── Quotes / reads ──
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'requiredAcceptanceAmount',
    outputs: [
      { name: 'stake', type: 'uint256' },
      { name: 'voteDeposit', type: 'uint256' },
      { name: 'totalRequired', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserFeeInfo',
    outputs: [
      { name: 'baseFeeBps', type: 'uint256' },
      { name: 'stakingRebate', type: 'uint256' },
      { name: 'referralRebate', type: 'uint256' },
      { name: 'effectiveFeeBps', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'quoteWager',
    outputs: [
      { name: 'totalPot', type: 'uint256' },
      { name: 'creatorFee', type: 'uint256' },
      { name: 'challengerFee', type: 'uint256' },
      { name: 'winnerPayout', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getReputation',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'wagersCreated', type: 'uint256' },
          { name: 'wagersWon', type: 'uint256' },
          { name: 'wagersLost', type: 'uint256' },
          { name: 'wagersDisputed', type: 'uint256' },
          { name: 'correctVotes', type: 'uint256' },
          { name: 'incorrectVotes', type: 'uint256' },
          { name: 'noVotes', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getOpenWagers',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'earlyResolutionVote',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    inputs: [],
    name: 'openWagerCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getWagerDetails returns FOUR values — the priceBet tuple was removed, and
  // the wager struct no longer carries a wagerType field.
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'getWagerDetails',
    outputs: [
      {
        name: 'wager',
        type: 'tuple',
        components: [
          { name: 'category', type: 'uint8' },
          { name: 'creator', type: 'address' },
          { name: 'challenger', type: 'address' },
          { name: 'creatorStake', type: 'uint256' },
          { name: 'challengerStake', type: 'uint256' },
          { name: 'creatorVoteDeposit', type: 'uint256' },
          { name: 'challengerVoteDeposit', type: 'uint256' },
          { name: 'description', type: 'string' },
          { name: 'eventDate', type: 'uint256' },
          { name: 'depositDeadline', type: 'uint256' },
          { name: 'votingDeadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'creatorVote', type: 'address' },
          { name: 'challengerVote', type: 'address' },
          { name: 'winner', type: 'address' },
        ],
      },
      { name: 'creatorRequestedVoid', type: 'bool' },
      { name: 'challengerRequestedVoid', type: 'bool' },
      { name: 'arbitrationStart', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    name: 'getArbitrationStatus',
    outputs: [
      { name: 'arbitrators', type: 'address[]' },
      { name: 'votes', type: 'address[]' },
      { name: 'creatorVotes', type: 'uint256' },
      { name: 'challengerVotes', type: 'uint256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'start', type: 'uint256' },
      { name: 'count', type: 'uint256' },
    ],
    name: 'getWagersPaginated',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'userWagerCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'start', type: 'uint256' },
      { name: 'count', type: 'uint256' },
    ],
    name: 'getUserWagers',
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  // ── Protocol stat counters (public state) ──
  { inputs: [], name: 'totalVolume', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalResolved', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalVoided', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalWagerCount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'wagerCount', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalStandardWagers', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalProtocolFees', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalStakerFees', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalPayouts', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalFeeAccrued', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalReferralLiabilities', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'activeArbitrations', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'stakerFeeSplitBps', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'publicWagering', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'devRecipient', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'stakingRecipient', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'isArbitrator',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'arbitratorList',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // ── Events ──
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'wagerId', type: 'uint256' },
      { indexed: true, name: 'party', type: 'address' },
      { indexed: true, name: 'proposedWinner', type: 'address' },
    ],
    name: 'EarlyResolutionProposed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'wagerId', type: 'uint256' },
      { indexed: true, name: 'winner', type: 'address' },
    ],
    name: 'WagerResolvedEarly',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'wagerId', type: 'uint256' },
      { indexed: true, name: 'challenger', type: 'address' },
    ],
    name: 'WagerAccepted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'wagerId', type: 'uint256' },
      { indexed: true, name: 'winner', type: 'address' },
      { indexed: false, name: 'payout', type: 'uint256' },
    ],
    name: 'WagerResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'wagerId', type: 'uint256' }],
    name: 'WagerEscalated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'wagerId', type: 'uint256' }],
    name: 'ArbitrationAutoVoided',
    type: 'event',
  },
] as const