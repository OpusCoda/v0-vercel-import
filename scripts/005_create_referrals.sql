-- Referral system: name registry + immutable user->referrer bindings
-- Off-chain pre-launch registry. On-chain enforcement happens once the
-- protocol contracts (Prediction Market, Oath Vault) are deployed.

-- Maps a human-readable referral name to a wallet address.
CREATE TABLE IF NOT EXISTS referral_names (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- One name per wallet (a wallet can own at most one referral name).
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_names_wallet
  ON referral_names (LOWER(wallet_address));

-- Fast case-insensitive name lookups.
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_names_name
  ON referral_names (LOWER(name));

-- Immutable binding of a user wallet to the referrer that introduced them.
-- A user can only ever be bound to ONE referrer (enforced by PK).
CREATE TABLE IF NOT EXISTS referral_bindings (
  user_wallet TEXT PRIMARY KEY,
  referrer_wallet TEXT NOT NULL,
  referrer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Look up everyone a given referrer has introduced.
CREATE INDEX IF NOT EXISTS idx_referral_bindings_referrer
  ON referral_bindings (LOWER(referrer_wallet));
