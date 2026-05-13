-- Mu$ic-fans Database Schema
-- Run this once to set up your PostgreSQL database
-- Command: psql -U postgres -d mu$ic-fans -f schema.sql

-- Create database (run separately if needed)
-- CREATE DATABASE mu$ic-fans;

-- ── ARTISTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artists (
  id                SERIAL PRIMARY KEY,
  spotify_id        VARCHAR(100) UNIQUE NOT NULL,
  display_name      VARCHAR(200) NOT NULL,
  email             VARCHAR(200),
  avatar_url        TEXT,
  spotify_artist_id VARCHAR(100),     -- their Spotify artist profile ID
  artist_verified   BOOLEAN DEFAULT FALSE,
  wallet_address    VARCHAR(100),     -- Solana wallet
  followers         INTEGER DEFAULT 0,
  refresh_token     TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ── FANS ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fans (
  id              SERIAL PRIMARY KEY,
  spotify_id      VARCHAR(100) UNIQUE NOT NULL,
  display_name    VARCHAR(200) NOT NULL,
  email           VARCHAR(200),
  avatar_url      TEXT,
  is_premium      BOOLEAN DEFAULT FALSE,
  wallet_address  VARCHAR(100),       -- Solana wallet
  refresh_token   TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── POOLS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pools (
  id                   SERIAL PRIMARY KEY,
  artist_id            INTEGER REFERENCES artists(id),
  title                VARCHAR(300) NOT NULL,
  description          TEXT,
  reward_type          VARCHAR(50),   -- token | nft | merch | exclusive_content
  reward_description   TEXT,
  total_reward         DECIMAL(18,6),
  currency             VARCHAR(20) DEFAULT 'SOL',
  duration_days        INTEGER NOT NULL,
  top_n                INTEGER NOT NULL,  -- number of winners
  tiers                JSONB,             -- prize breakdown per rank
  wallet_address       VARCHAR(100),      -- artist wallet that funded pool
  contract_address     VARCHAR(100),      -- Solana program address
  status               VARCHAR(20) DEFAULT 'active',  -- active | closed | distributed
  participant_count    INTEGER DEFAULT 0,
  starts_at            TIMESTAMP DEFAULT NOW(),
  ends_at              TIMESTAMP NOT NULL,
  created_at           TIMESTAMP DEFAULT NOW()
);

-- ── POOL PARTICIPANTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pool_participants (
  id         SERIAL PRIMARY KEY,
  pool_id    INTEGER REFERENCES pools(id),
  fan_id     INTEGER REFERENCES fans(id),
  joined_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(pool_id, fan_id)
);

-- ── LISTENING SCORES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listening_scores (
  id           SERIAL PRIMARY KEY,
  pool_id      INTEGER REFERENCES pools(id),
  fan_id       INTEGER REFERENCES fans(id),
  score_seconds INTEGER DEFAULT 0,   -- total verified listening seconds
  last_synced  TIMESTAMP DEFAULT NOW(),
  UNIQUE(pool_id, fan_id)
);

-- ── REWARDS DISTRIBUTED ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id               SERIAL PRIMARY KEY,
  pool_id          INTEGER REFERENCES pools(id),
  fan_id           INTEGER REFERENCES fans(id),
  rank             INTEGER,
  amount           DECIMAL(18,6),
  currency         VARCHAR(20),
  wallet_address   VARCHAR(100),
  tx_signature     VARCHAR(200),    -- Solana transaction signature
  distributed_at   TIMESTAMP DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pools_status      ON pools(status);
CREATE INDEX IF NOT EXISTS idx_scores_pool       ON listening_scores(pool_id);
CREATE INDEX IF NOT EXISTS idx_scores_fan        ON listening_scores(fan_id);
CREATE INDEX IF NOT EXISTS idx_participants_pool ON pool_participants(pool_id);
