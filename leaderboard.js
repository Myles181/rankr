/**
 * Rankr — Leaderboard Routes
 * ──────────────────────────────
 * Fetches verified listening time from Spotify,
 * scores fans, and returns live rankings.
 */

const express = require('express');
const axiosLib = require('axios');
const router  = express.Router();

// In-memory scores store (replace with PostgreSQL in production)
// Structure: { poolId: { fanSpotifyId: { score, displayName, avatar, lastUpdated } } }
let scores = {};


// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Login required' });
  next();
}


// ── GET LEADERBOARD FOR A POOL ────────────────────────────────────────────────
router.get('/:poolId', (req, res) => {
  const { poolId } = req.params;
  const poolScores = scores[poolId] || {};

  const ranked = Object.entries(poolScores)
    .map(([spotifyId, data]) => ({ spotifyId, ...data }))
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  res.json(ranked);
});


// ── SYNC LISTENING TIME ───────────────────────────────────────────────────────
// Fan calls this to update their score using their Spotify recent plays
router.post('/:poolId/sync', requireAuth, async (req, res) => {
  const { poolId }     = req.params;
  const { artistId }   = req.body;  // Spotify artist ID to filter plays
  const { accessToken, spotifyId, displayName, avatar } = req.session.user;

  if (req.session.user.role !== 'fan') {
    return res.status(403).json({ error: 'Only fans can sync listening time' });
  }

  try {
    // Fetch recently played tracks from Spotify
    const resp = await axiosLib.get(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const items = resp.data.items || [];

    // Filter tracks by this artist and count valid plays.
    // Spotify recently-played does not expose actual listen time, only that a
    // track was played. Using full duration_ms would over-credit partial plays,
    // so each qualifying play earns a fixed 3-minute credit instead.
    const CREDIT_PER_PLAY_SECONDS = 180; // 3 minutes
    const MIN_TRACK_MS = 30 * 1000;      // ignore tracks shorter than 30s

    let newScore = 0;
    items.forEach(item => {
      const track = item.track;
      const isThisArtist = track.artists?.some(a => a.id === artistId);
      if (!isThisArtist) return;
      if ((track.duration_ms || 0) >= MIN_TRACK_MS) {
        newScore += CREDIT_PER_PLAY_SECONDS;
      }
    });

    // Update scores
    if (!scores[poolId]) scores[poolId] = {};

    const existing = scores[poolId][spotifyId];
    // Only update if new score is higher (prevents replay attacks)
    if (!existing || newScore > existing.score) {
      scores[poolId][spotifyId] = {
        score:       newScore,
        displayName: displayName,
        avatar:      avatar,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Return updated rank
    const poolScores = scores[poolId];
    const ranked = Object.entries(poolScores)
      .map(([id, data]) => ({ spotifyId: id, ...data }))
      .sort((a, b) => b.score - a.score);
    const myRank = ranked.findIndex(e => e.spotifyId === spotifyId) + 1;

    res.json({
      success:     true,
      score:       scores[poolId][spotifyId].score,
      rank:        myRank,
      totalFans:   ranked.length,
    });

  } catch (err) {
    console.error('Sync error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to sync listening data' });
  }
});


// ── GET MY SCORE ──────────────────────────────────────────────────────────────
router.get('/:poolId/me', requireAuth, (req, res) => {
  const { poolId }  = req.params;
  const { spotifyId } = req.session.user;

  const poolScores = scores[poolId] || {};
  const myData     = poolScores[spotifyId];

  if (!myData) {
    return res.json({ score: 0, rank: null, message: 'No data yet — start streaming!' });
  }

  const ranked = Object.entries(poolScores)
    .map(([id, data]) => ({ spotifyId: id, ...data }))
    .sort((a, b) => b.score - a.score);
  const myRank = ranked.findIndex(e => e.spotifyId === spotifyId) + 1;

  res.json({
    score:     myData.score,
    rank:      myRank,
    totalFans: ranked.length,
    formatted: formatTime(myData.score),
  });
});


// ── HELPER — format seconds to readable ──────────────────────────────────────
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}


module.exports = router;
