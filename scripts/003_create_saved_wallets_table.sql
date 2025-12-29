-- Create table for saving wallet lists that work across browsers
CREATE TABLE IF NOT EXISTS saved_wallet_lists (
  id SERIAL PRIMARY KEY,
  list_name VARCHAR(255) NOT NULL UNIQUE,
  wallet_addresses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_saved_wallets_name ON saved_wallet_lists(list_name);
