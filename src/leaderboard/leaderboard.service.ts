import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SessionUser } from '../common/types/session.types';

interface FanScore {
  score: number;
  displayName: string;
  avatar: string | null;
  lastUpdated: string;
}

interface ScoreStore {
  [poolId: string]: { [spotifyId: string]: FanScore };
}

@Injectable()
export class LeaderboardService {
  private scores: ScoreStore = {};

  private readonly CREDIT_PER_PLAY_SECONDS = 180;
  private readonly MIN_TRACK_MS = 30 * 1000;

  getRanked(poolId: string) {
    const poolScores = this.scores[poolId] ?? {};
    return Object.entries(poolScores)
      .map(([spotifyId, data]) => ({ spotifyId, ...data }))
      .sort((a, b) => b.score - a.score)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  }

  getMyScore(poolId: string, spotifyId: string) {
    const poolScores = this.scores[poolId] ?? {};
    const myData     = poolScores[spotifyId];

    if (!myData) {
      return { score: 0, rank: null, message: "No data yet — start streaming!" };
    }

    const ranked = this.getRanked(poolId);
    const myRank = ranked.findIndex(e => e.spotifyId === spotifyId) + 1;

    return {
      score:     myData.score,
      rank:      myRank,
      totalFans: ranked.length,
      formatted: this.formatTime(myData.score),
    };
  }

  async syncScore(poolId: string, artistId: string, user: SessionUser) {
    const { accessToken, spotifyId, displayName, avatar } = user;

    const resp = await axios.get(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const items = resp.data.items ?? [];
    let newScore = 0;

    for (const item of items) {
      const track = item.track;
      const isThisArtist = track.artists?.some((a: any) => a.id === artistId);
      if (!isThisArtist) continue;
      if ((track.duration_ms ?? 0) >= this.MIN_TRACK_MS) {
        newScore += this.CREDIT_PER_PLAY_SECONDS;
      }
    }

    if (!this.scores[poolId]) this.scores[poolId] = {};

    const existing = this.scores[poolId][spotifyId];
    if (!existing || newScore > existing.score) {
      this.scores[poolId][spotifyId] = {
        score:       newScore,
        displayName,
        avatar,
        lastUpdated: new Date().toISOString(),
      };
    }

    const ranked = this.getRanked(poolId);
    const myRank = ranked.findIndex(e => e.spotifyId === spotifyId) + 1;

    return {
      success:   true,
      score:     this.scores[poolId][spotifyId].score,
      rank:      myRank,
      totalFans: ranked.length,
    };
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
