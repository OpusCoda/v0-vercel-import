-- Create portfolios table to store Portfolio IDs and wallet data
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  portfolio_id VARCHAR(6) UNIQUE NOT NULL,
  wallet_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on portfolio_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_id ON portfolios(portfolio_id);
