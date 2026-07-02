import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SessionUser } from '../common/types/session.types';

const SPOTIFY_TOKEN_URL  = 'https://accounts.spotify.com/api/token';
const SPOTIFY_AUTH_URL   = 'https://accounts.spotify.com/authorize';
const SPOTIFY_PROFILE_URL = 'https://api.spotify.com/v1/me';
const SPOTIFY_SEARCH_URL  = 'https://api.spotify.com/v1/search';

const FAN_SCOPES    = 'user-read-email user-read-private user-read-recently-played user-top-read';
const ARTIST_SCOPES = 'user-read-email user-read-private user-top-read';

@Injectable()
export class AuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly fanRedirectUri: string;
  private readonly artistRedirectUri: string;
  private readonly frontendUrl: string;

  constructor(private config: ConfigService) {
    this.clientId         = config.get('SPOTIFY_CLIENT_ID');
    this.clientSecret     = config.get('SPOTIFY_CLIENT_SECRET');
    this.fanRedirectUri   = config.get('SPOTIFY_REDIRECT_URI');
    this.artistRedirectUri = config.get('SPOTIFY_ARTIST_REDIRECT_URI');
    this.frontendUrl      = config.get('FRONTEND_URL') || 'http://localhost:4000';
  }

  buildAuthUrl(role: 'fan' | 'artist'): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     this.clientId,
      scope:         role === 'fan' ? FAN_SCOPES : ARTIST_SCOPES,
      redirect_uri:  role === 'fan' ? this.fanRedirectUri : this.artistRedirectUri,
      state:         role,
      show_dialog:   'true',
    });
    return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  async handleCallback(code: string, role: 'fan' | 'artist'): Promise<SessionUser> {
    const redirectUri = role === 'fan' ? this.fanRedirectUri : this.artistRedirectUri;
    const basicAuth   = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const tokenRes = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth}` } },
    );

    const { access_token, refresh_token } = tokenRes.data;

    const profileRes = await axios.get(SPOTIFY_PROFILE_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileRes.data;

    if (role === 'fan') {
      if (profile.product !== 'premium') {
        throw new UnauthorizedException('premium_required');
      }
      return {
        role:         'fan',
        spotifyId:    profile.id,
        displayName:  profile.display_name,
        email:        profile.email ?? null,
        avatar:       profile.images?.[0]?.url ?? null,
        isPremium:    true,
        accessToken:  access_token,
        refreshToken: refresh_token,
      };
    }

    // Artist: verify against Spotify artist search
    const searchRes = await axios.get(
      `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(profile.display_name)}&type=artist&limit=5`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    const MIN_FOLLOWERS  = 100;
    const artists        = searchRes.data.artists?.items ?? [];
    const matchedArtist  = artists.find(
      (a: any) =>
        a.name.toLowerCase() === profile.display_name.toLowerCase() &&
        (a.followers?.total ?? 0) >= MIN_FOLLOWERS,
    );

    return {
      role:            'artist',
      spotifyId:       profile.id,
      displayName:     profile.display_name,
      email:           profile.email ?? null,
      avatar:          profile.images?.[0]?.url ?? null,
      spotifyArtistId: matchedArtist?.id ?? null,
      artistVerified:  !!matchedArtist,
      followers:       matchedArtist?.followers?.total ?? 0,
      accessToken:     access_token,
      refreshToken:    refresh_token,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth}` } },
    );
    return res.data.access_token;
  }

  async searchArtistTracks(
    query: string,
    accessToken: string,
    spotifyArtistId: string | null,
    displayName: string,
  ): Promise<{ id: string; name: string; albumName: string; albumArt: string | null }[]> {
    const res = await axios.get(
      `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=track&limit=20`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const tracks: any[] = res.data.tracks?.items ?? [];

    return tracks
      .filter(t =>
        t.artists?.some((a: any) =>
          spotifyArtistId ? a.id === spotifyArtistId : a.name.toLowerCase() === displayName.toLowerCase(),
        ),
      )
      .slice(0, 10)
      .map(t => ({
        id:        t.id,
        name:      t.name,
        albumName: t.album?.name ?? '',
        albumArt:  t.album?.images?.[1]?.url ?? null,
      }));
  }

  get frontendBaseUrl(): string {
    return this.frontendUrl;
  }
}
