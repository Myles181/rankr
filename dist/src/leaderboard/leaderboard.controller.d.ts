import { Request } from 'express';
import { LeaderboardService } from './leaderboard.service';
import { SyncScoreDto } from './dto/sync-score.dto';
import '../common/types/session.types';
export declare class LeaderboardController {
    private readonly leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getRanked(poolId: string): {
        rank: number;
        score: number;
        displayName: string;
        avatar: string | null;
        lastUpdated: string;
        spotifyId: string;
    }[];
    myScore(poolId: string, req: Request): {
        score: number;
        rank: any;
        message: string;
        totalFans?: undefined;
        formatted?: undefined;
    } | {
        score: number;
        rank: number;
        totalFans: number;
        formatted: string;
        message?: undefined;
    };
    syncScore(poolId: string, dto: SyncScoreDto, req: Request): Promise<{
        success: boolean;
        score: number;
        rank: number;
        totalFans: number;
    }>;
}
