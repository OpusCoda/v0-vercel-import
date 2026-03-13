-- Create table to track Smaug ROI wallet balance snapshots
CREATE TABLE IF NOT EXISTS smaug_roi_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  smaug_balance NUMERIC NOT NULL,
  roi_24h NUMERIC,
  roi_7d NUMERIC,
  roi_30d NUMERIC
);

-- Create index on snapshot_time for efficient queries
CREATE INDEX IF NOT EXISTS idx_smaug_roi_snapshots_time ON smaug_roi_snapshots(snapshot_time DESC);
