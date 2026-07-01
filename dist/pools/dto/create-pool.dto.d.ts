export declare class CreatePoolDto {
    title: string;
    description?: string;
    rewardType: string;
    rewardDescription?: string;
    totalReward: number;
    currency?: string;
    durationDays: number;
    topN: number;
    tiers?: {
        rank: number;
        amount: number;
    }[];
    walletAddress?: string;
    contractAddress?: string;
}
