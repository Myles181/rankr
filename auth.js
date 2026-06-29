/**
 * Rankr — Spotify OAuth
 * ────────────────────────
 * Two separate flows:
 *   /auth/spotify/fan    → Fan login (Premium required)
 *   /auth/spotify/artist → Artist login (must be verified Spotify artist)
 */

const express  = require('express');
const axios    = require('axios');
const qs       = require('querystring');
const router   = express.Router();

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const FRONTEND_URL  = process.env.FRONTEND_URL || 'http://localhost:3000';

// Scopes needed for fans
const FAN_SCOPES = [
  'user-read-email',
  'user-read-private',          // lets us check if Premium
  'user-read-recently-played',  // listening history
].join(' ');

// Scopes needed for artists (same + identity verification)
const ARTIST_SCOPES = [
  'user-read-email',
  'user-read-private',
].join(' ');


// ── FAN LOGIN ─────────────────────────────────────────────────────────────────

router.get('/spotify/fan', (req, res) => {
  const params = qs.stringify({
    response_type: 'code',
    client_id:     CLIENT_ID,
    scope:         FAN_SCOPES,
    redirect_uri:  process.env.SPOTIFY_REDIRECT_URI,
    state:         'fan',
    show_dialog:   true,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});


// ── ARTIST LOGIN ──────────────────────────────────────────────────────────────

router.get('/spotify/artist', (req, res) => {
  const params = qs.stringify({
    response_type: 'code',
    client_id:     CLIENT_ID,
    scope:         ARTIST_SCOPES,
    redirect_uri:  process.env.SPOTIFY_ARTIST_REDIRECT_URI,
    state:         'artist',
    show_dialog:   true,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});


// ── SHARED CALLBACK ───────────────────────────────────────────────────────────

async function handleCallback(req, res, redirectUri, role) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/auth-error?msg=${error}`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify({
        grant_type:   'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type':  'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    const { access_token, refresh_token } = tokenRes.data;

    // Fetch Spotify profile
    const profileRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = profileRes.data;

    // ── FAN: Check Spotify Premium ─────────────────────────────────────────
    if (role === 'fan') {
      if (profile.product !== 'premium') {
        return res.redirect(
          `${FRONTEND_URL}/auth-error?msg=premium_required`
        );
      }

      // Store fan session
      req.session.user = {
        role:          'fan',
        spotifyId:     profile.id,
        displayName:   profile.display_name,
        email:         profile.email,
        avatar:        profile.images?.[0]?.url || null,
        isPremium:     true,
        accessToken:   access_token,
        refreshToken:  refresh_token,
      };

      return res.redirect(`${FRONTEND_URL}/fan/dashboard`);
    }

    // ── ARTIST: Verify they are a Spotify artist ───────────────────────────
    if (role === 'artist') {
      // Search Spotify for this user's display name as an artist
      const searchRes = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(profile.display_name)}&type=artist&limit=5`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      const artists      = searchRes.data.artists?.items || [];
      // Require an exact name match plus a meaningful follower count (≥100)
      // to prevent random accounts from self-verifying as artists. Accounts
      // below the threshold are directed to the manual verification page.
      const MIN_FOLLOWERS = 100;
      const matchedArtist = artists.find(
        (a) =>
          a.name.toLowerCase() === profile.display_name.toLowerCase() &&
          (a.followers?.total ?? 0) >= MIN_FOLLOWERS
      );

      // Store artist session (verified flag based on search match)
      req.session.user = {
        role:            'artist',
        spotifyId:       profile.id,
        displayName:     profile.display_name,
        email:           profile.email,
        avatar:          profile.images?.[0]?.url || null,
        spotifyArtistId: matchedArtist?.id || null,
        artistVerified:  !!matchedArtist,
        followers:       matchedArtist?.followers?.total || 0,
        accessToken:     access_token,
        refreshToken:    refresh_token,
      };

      // Redirect with verification status
      if (matchedArtist) {
        return res.redirect(`${FRONTEND_URL}/artist/dashboard`);
      } else {
        // Not auto-verified — send to manual verification page
        return res.redirect(`${FRONTEND_URL}/artist/verify`);
      }
    }

  } catch (err) {
    console.error('OAuth error:', err.response?.data || err.message);
    return res.redirect(`${FRONTEND_URL}/auth-error?msg=server_error`);
  }
}

// Callback endpoints
router.get('/spotify/callback', (req, res) => {
  handleCallback(req, res, process.env.SPOTIFY_REDIRECT_URI, 'fan');
});

router.get('/spotify/artist/callback', (req, res) => {
  handleCallback(req, res, process.env.SPOTIFY_ARTIST_REDIRECT_URI, 'artist');
});


// ── SESSION CHECK ─────────────────────────────────────────────────────────────

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Return session without sensitive tokens
  const { accessToken, refreshToken, ...safe } = req.session.user;
  res.json(safe);
});


// ── LOGOUT ────────────────────────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});


module.exports = router;
