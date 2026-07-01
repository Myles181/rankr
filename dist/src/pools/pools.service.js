"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolsService = void 0;
const common_1 = require("@nestjs/common");
let PoolsService = class PoolsService {
    constructor() {
        this.pools = [];
        this.idCounter = 1;
    }
    findAllActive() {
        const now = new Date();
        return this.pools.filter(p => p.status === 'active' && new Date(p.endsAt) > now);
    }
    findOne(id) {
        const pool = this.pools.find(p => p.id === id);
        if (!pool)
            throw new common_1.NotFoundException('Pool not found');
        return pool;
    }
    findByArtist(spotifyId) {
        return this.pools.filter(p => p.artistSpotifyId === spotifyId);
    }
    create(dto, artist) {
        const now = new Date();
        const endsAt = new Date(now.getTime() + dto.durationDays * 24 * 60 * 60 * 1000);
        const pool = {
            id: this.idCounter++,
            artistSpotifyId: artist.spotifyId,
            artistName: artist.displayName,
            artistAvatar: artist.avatar,
            artistVerified: artist.artistVerified ?? false,
            title: dto.title,
            description: dto.description ?? null,
            rewardType: dto.rewardType,
            rewardDescription: dto.rewardDescription ?? null,
            totalReward: dto.totalReward,
            currency: dto.currency ?? 'SOL',
            durationDays: dto.durationDays,
            topN: dto.topN,
            tiers: dto.tiers ?? [],
            walletAddress: dto.walletAddress ?? null,
            contractAddress: dto.contractAddress ?? null,
            status: 'active',
            participants: 0,
            createdAt: now.toISOString(),
            endsAt: endsAt.toISOString(),
        };
        this.pools.push(pool);
        return pool;
    }
    join(id) {
        const pool = this.findOne(id);
        if (pool.status !== 'active')
            throw new common_1.BadRequestException('Pool is not active');
        pool.participants += 1;
        return pool;
    }
    close(id, artistSpotifyId) {
        const pool = this.pools.find(p => p.id === id && p.artistSpotifyId === artistSpotifyId);
        if (!pool)
            throw new common_1.NotFoundException('Pool not found or not yours');
        pool.status = 'closed';
        return pool;
    }
};
exports.PoolsService = PoolsService;
exports.PoolsService = PoolsService = __decorate([
    (0, common_1.Injectable)()
], PoolsService);
//# sourceMappingURL=pools.service.js.map