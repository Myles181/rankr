import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { Pool } from './interfaces/pool.interface';
import { CreatePoolDto } from './dto/create-pool.dto';
import { SessionUser } from '../common/types/session.types';

export interface PoolEntry {
  fanSpotifyId: string;
  fanName: string;
  fanAvatar: string | null;
  score: number;
  rank: number;
  syncedAt: string;
}

@Injectable()
export class PoolsService {
  private pools: Pool[] = [];
  private idCounter = 1;
  private entries: Map<number, PoolEntry[]> = new Map();

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

  async sync(id: number, fan: SessionUser): Promise<PoolEntry & { poolTitle: string }> {
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

    // Fetch fan's top tracks from Spotify
    const res = await axios.get(
      'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50',
      { headers: { Authorization: `Bearer ${fan.accessToken}` } },
    );

    const topTracks: any[] = res.data.items ?? [];

    if (pool.trackId) {
      // Score based on rank position: track at index 0 = 50pts, index 49 = 1pt, not present = 0
      const idx = topTracks.findIndex(t => t.id === pool.trackId);
      entry.score = idx >= 0 ? 50 - idx : 0;
    } else {
      // No track specified — score by total listen count proxy (position in general top tracks)
      const artistTracks = topTracks.filter(t =>
        t.artists?.some((a: any) => a.name.toLowerCase() === pool.artistName.toLowerCase()),
      );
      entry.score = artistTracks.length > 0 ? 50 - topTracks.indexOf(artistTracks[0]) : 0;
    }

    entry.syncedAt = new Date().toISOString();

    // Re-rank everyone
    poolEntries.sort((a, b) => b.score - a.score);
    poolEntries.forEach((e, i) => { e.rank = i + 1; });
    this.entries.set(id, poolEntries);

    return { ...entry, poolTitle: pool.title };
  }

  leaderboard(id: number): PoolEntry[] {
    this.findOne(id); // throws if pool doesn't exist
    return (this.entries.get(id) ?? []).slice().sort((a, b) => b.score - a.score);
  }

  close(id: number, artistSpotifyId: string): Pool {
    const pool = this.pools.find(p => p.id === id && p.artistSpotifyId === artistSpotifyId);
    if (!pool) throw new NotFoundException('Pool not found or not yours');
    pool.status = 'closed';
    return pool;
  }
}
