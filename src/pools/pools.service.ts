import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { Pool } from './interfaces/pool.interface';
import { CreatePoolDto } from './dto/create-pool.dto';
import { SessionUser } from '../common/types/session.types';
import { AuthService } from '../auth/auth.service';

export interface PoolEntry {
  fanSpotifyId: string;
  fanName: string;
  fanAvatar: string | null;
  score: number;
  rank: number;
  syncedAt: string;
}

const TOP_TRACKS_URL = 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50';

@Injectable()
export class PoolsService {
  private pools: Pool[] = [];
  private idCounter = 1;
  private entries: Map<number, PoolEntry[]> = new Map();

  constructor(private readonly authService: AuthService) {}

  findAllActive(): Pool[] {
    const now = new Date();
    return this.pools.filter(p => p.status === 'active' && new Date(p.endsAt) > now);
  }

  findOne(id: number): Pool {
    const pool = this.pools.find(p => p.id === id);
    if (!pool) throw new NotFoundException('Pool not found');
    return pool;
  }

  findByArtist(spotifyId: string): Pool[] {
    return this.pools.filter(p => p.artistSpotifyId === spotifyId);
  }

  create(dto: CreatePoolDto, artist: SessionUser): Pool {
    const now    = new Date();
    const endsAt = new Date(now.getTime() + dto.durationDays * 24 * 60 * 60 * 1000);

    const pool: Pool = {
      id:                this.idCounter++,
      artistSpotifyId:   artist.spotifyId,
      artistName:        artist.displayName,
      artistAvatar:      artist.avatar,
      artistVerified:    artist.artistVerified ?? false,
      title:             dto.title,
      description:       dto.description ?? null,
      rewardType:        dto.rewardType,
      rewardDescription: dto.rewardDescription ?? null,
      totalReward:       dto.totalReward,
      currency:          dto.currency ?? 'SOL',
      durationDays:      dto.durationDays,
      topN:              dto.topN,
      tiers:             dto.tiers ?? [],
      walletAddress:     dto.walletAddress ?? null,
      contractAddress:   dto.contractAddress ?? null,
      criteriaType:      (dto.criteriaType as 'first_N' | 'most_played') ?? 'most_played',
      trackId:           dto.trackId ?? null,
      trackName:         dto.trackName ?? null,
      status:            'active',
      participants:      0,
      createdAt:         now.toISOString(),
      endsAt:            endsAt.toISOString(),
    };

    this.pools.push(pool);
    this.entries.set(pool.id, []);
    return pool;
  }

  join(id: number, fan: SessionUser): { pool: Pool; alreadyJoined: boolean } {
    const pool = this.findOne(id);
    if (pool.status !== 'active') throw new BadRequestException('Pool is not active');

    const poolEntries = this.entries.get(id) ?? [];
    const alreadyJoined = poolEntries.some(e => e.fanSpotifyId === fan.spotifyId);

    if (!alreadyJoined) {
      poolEntries.push({
        fanSpotifyId: fan.spotifyId,
        fanName:      fan.displayName,
        fanAvatar:    fan.avatar ?? null,
        score:        0,
        rank:         poolEntries.length + 1,
        syncedAt:     new Date().toISOString(),
      });
      this.entries.set(id, poolEntries);
      pool.participants += 1;
    }

    return { pool, alreadyJoined };
  }

  async sync(id: number, fan: SessionUser): Promise<PoolEntry & { poolTitle: string; newAccessToken?: string }> {
    const pool = this.findOne(id);
    if (pool.status !== 'active') throw new BadRequestException('Pool is not active');

    const poolEntries = this.entries.get(id) ?? [];
    let entry = poolEntries.find(e => e.fanSpotifyId === fan.spotifyId);

    if (!entry) {
      entry = {
        fanSpotifyId: fan.spotifyId,
        fanName:      fan.displayName,
        fanAvatar:    fan.avatar ?? null,
        score:        0,
        rank:         poolEntries.length + 1,
        syncedAt:     new Date().toISOString(),
      };
      poolEntries.push(entry);
      pool.participants += 1;
    }

    // Fetch top tracks, refreshing access token on 401
    let newAccessToken: string | undefined;
    const fetchTopTracks = (token: string) =>
      axios.get(TOP_TRACKS_URL, { headers: { Authorization: `Bearer ${token}` } });

    let res: any;
    try {
      res = await fetchTopTracks(fan.accessToken);
    } catch (err: any) {
      if (err.response?.status !== 401) throw err;
      newAccessToken = await this.authService.refreshAccessToken(fan.refreshToken);
      res = await fetchTopTracks(newAccessToken);
    }

    const topTracks: any[] = res.data.items ?? [];

    if (pool.trackId) {
      const idx = topTracks.findIndex(t => t.id === pool.trackId);
      entry.score = idx >= 0 ? 50 - idx : 0;
    } else {
      const artistTracks = topTracks.filter(t =>
        t.artists?.some((a: any) => a.name.toLowerCase() === pool.artistName.toLowerCase()),
      );
      entry.score = artistTracks.length > 0 ? 50 - topTracks.indexOf(artistTracks[0]) : 0;
    }

    entry.syncedAt = new Date().toISOString();

    poolEntries.sort((a, b) => b.score - a.score);
    poolEntries.forEach((e, i) => { e.rank = i + 1; });
    this.entries.set(id, poolEntries);

    return { ...entry, poolTitle: pool.title, ...(newAccessToken ? { newAccessToken } : {}) };
  }

  leaderboard(id: number): PoolEntry[] {
    this.findOne(id); // throws if pool doesn't exist
    return (this.entries.get(id) ?? []).slice().sort((a, b) => b.score - a.score);
  }

  close(id: number, artistSpotifyId: string): Pool {
    const pool = this.pools.find(p => p.id === id && p.artistSpotifyId === artistSpotifyId);
    if (!pool) throw new NotFoundException('Pool not found or not yours');
    pool.status  = 'closed';
    pool.winners = this.leaderboard(id).slice(0, pool.topN);
    return pool;
  }
}
