/**
 * Mu$ic-fans Backend Server
 * ─────────────────────
 * Handles Spotify OAuth (fans + artists),
 * leaderboard scoring, and pool management.
 */

require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const cors       = require('cors');
const authRoutes = require('./routes/auth');
const poolRoutes = require('./routes/pools');
const lbRoutes   = require('./routes/leaderboard');

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mu$ic-fans_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,       // set true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  },
}));

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
  console.log(`\nMu$ic-fans backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health\n`);
});
