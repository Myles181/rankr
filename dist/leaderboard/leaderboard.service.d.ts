import { SessionUser } from '../common/types/session.types';
export declare class LeaderboardService {
    private scores;
    private readonly CREDIT_PER_PLAY_SECONDS;
    private readonly MIN_TRACK_MS;
    getRanked(poolId: string): {
        rank: number;
        score: number;
        displayName: string;
        avatar: string | null;
        lastUpdated: string;
        spotifyId: string;
    }[];
    getMyScore(poolId: string, spotifyId: string): {
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
    syncScore(poolId: string, artistId: string, user: SessionUser): Promise<{
        success: boolean;
        score: number;
        rank: number;
        totalFans: number;
    }>;
    private formatTime;
}
