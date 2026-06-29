import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from './interfaces/pool.interface';
import { CreatePoolDto } from './dto/create-pool.dto';
import { SessionUser } from '../common/types/session.types';

@Injectable()
export class PoolsService {
  private pools: Pool[] = [];
  private idCounter = 1;

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
    const now   = new Date();
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
      status:            'active',
      participants:      0,
      createdAt:         now.toISOString(),
      endsAt:            endsAt.toISOString(),
    };

    this.pools.push(pool);
    return pool;
  }

  join(id: number): Pool {
    const pool = this.findOne(id);
    if (pool.status !== 'active') throw new BadRequestException('Pool is not active');
    pool.participants += 1;
    return pool;
  }

  close(id: number, artistSpotifyId: string): Pool {
    const pool = this.pools.find(p => p.id === id && p.artistSpotifyId === artistSpotifyId);
    if (!pool) throw new NotFoundException('Pool not found or not yours');
    pool.status = 'closed';
    return pool;
  }
}
