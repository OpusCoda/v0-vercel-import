CREATE TABLE IF NOT EXISTS rewards_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  missor NUMERIC,
  finvesta NUMERIC,
  wgpp NUMERIC,
  weth NUMERIC,
  pwbtc NUMERIC,
  plsx NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_rewards_snapshots_time ON rewards_snapshots(snapshot_time DESC);
