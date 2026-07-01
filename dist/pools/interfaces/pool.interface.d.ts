export interface Pool {
    id: number;
    artistSpotifyId: string;
    artistName: string;
    artistAvatar: string | null;
    artistVerified: boolean;
    title: string;
    description: string | null;
    rewardType: string;
    rewardDescription: string | null;
    totalReward: number;
    currency: string;
    durationDays: number;
    topN: number;
    tiers: {
        rank: number;
        amount: number;
    }[];
    walletAddress: string | null;
    contractAddress: string | null;
    status: 'active' | 'closed' | 'distributed';
    participants: number;
    createdAt: string;
    endsAt: string;
}
