/**
 * Rankr Backend Server
 * ─────────────────────
 * Handles Spotify OAuth (fans + artists),
 * leaderboard scoring, and pool management.
 */

require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const cors       = require('cors');
const authRoutes = require('./auth');
const poolRoutes = require('./pools');
const lbRoutes   = require('./leaderboard');

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'rankr_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,       // set true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  },
}));

// ── STATIC FILES ─────────────────────────────────────────────────────────────
app.use(express.static(__dirname));

// Map clean paths to HTML files
app.get('/',                  (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/fan/dashboard',     (req, res) => res.sendFile(__dirname + '/fan-dashboard.html'));
app.get('/artist/dashboard',  (req, res) => res.sendFile(__dirname + '/artist-dashboard.html'));
app.get('/auth-error',        (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/artist/verify',     (req, res) => res.sendFile(__dirname + '/index.html'));

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/auth',        authRoutes);
app.use('/pools',       poolRoutes);
app.use('/leaderboard', lbRoutes);

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\nRankr backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health\n`);
});
