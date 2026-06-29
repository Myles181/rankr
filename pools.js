/**
 * Rankr — Pool Routes
 * ──────────────────────
 * Manage reward pools created by artists.
 */

const express = require('express');
const router  = express.Router();

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────
function requireArtist(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'artist') {
    return res.status(401).json({ error: 'Artist login required' });
  }
  next();
}

function requireFan(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'fan') {
    return res.status(401).json({ error: 'Fan login required' });
  }
  next();
}


// In-memory store for development
// Replace with PostgreSQL queries in production (see schema.sql)
let pools = [];
let poolIdCounter = 1;


// ── GET ALL ACTIVE POOLS ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const now    = new Date();
  const active = pools.filter(p => new Date(p.endsAt) > now && p.status === 'active');
  res.json(active);
});


// ── GET SINGLE POOL ───────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const pool = pools.find(p => p.id === parseInt(req.params.id));
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  res.json(pool);
});


// ── CREATE POOL (Artist only) ─────────────────────────────────────────────────
router.post('/', requireArtist, (req, res) => {
  const {
    title,            // pool name e.g. "Summer Drop Reward"
    description,      // short description
    rewardType,       // 'token' | 'nft' | 'merch' | 'exclusive_content'
    rewardDescription,// what exactly the reward is
    totalReward,      // total reward amount/value
    currency,         // 'SOL' | 'USDC' | 'custom'
    durationDays,     // how long the pool runs
    topN,             // how many winners e.g. top 10
    tiers,            // prize breakdown [{rank: 1, amount: 0.5}, ...]
    walletAddress,    // artist's Solana wallet
    contractAddress,  // filled after on-chain deployment
  } = req.body;

  // Basic validation
  if (!title || !rewardType || !totalReward || !durationDays || !topN) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const now     = new Date();
  const endsAt  = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const pool = {
    id:                poolIdCounter++,
    artistSpotifyId:   req.session.user.spotifyId,
    artistName:        req.session.user.displayName,
    artistAvatar:      req.session.user.avatar,
    artistVerified:    req.session.user.artistVerified,
    title,
    description,
    rewardType,
    rewardDescription,
    totalReward:       parseFloat(totalReward),
    currency:          currency || 'SOL',
    durationDays:      parseInt(durationDays),
    topN:              parseInt(topN),
    tiers:             tiers || [],
    walletAddress:     walletAddress || null,
    contractAddress:   contractAddress || null,
    status:            'active',
    participants:      0,
    createdAt:         now.toISOString(),
    endsAt:            endsAt.toISOString(),
  };

  pools.push(pool);

  console.log(`New pool created: "${title}" by ${req.session.user.displayName}`);
  res.status(201).json(pool);
});


// ── JOIN POOL (Fan only) ──────────────────────────────────────────────────────
router.post('/:id/join', requireFan, (req, res) => {
  const pool = pools.find(p => p.id === parseInt(req.params.id));
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  if (pool.status !== 'active') return res.status(400).json({ error: 'Pool is not active' });

  pool.participants += 1;
  res.json({ success: true, pool });
});


// ── CLOSE POOL (Artist only) ──────────────────────────────────────────────────
router.post('/:id/close', requireArtist, (req, res) => {
  const pool = pools.find(
    p => p.id === parseInt(req.params.id) &&
    p.artistSpotifyId === req.session.user.spotifyId
  );
  if (!pool) return res.status(404).json({ error: 'Pool not found or not yours' });

  pool.status = 'closed';
  res.json({ success: true, pool });
});


module.exports = router;
