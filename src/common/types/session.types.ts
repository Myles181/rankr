import 'express-session';

export interface SessionUser {
  role: 'fan' | 'artist';
  spotifyId: string;
  displayName: string;
  email: string | null;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
  isPremium?: boolean;
  spotifyArtistId?: string | null;
  artistVerified?: boolean;
  followers?: number;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}
