import { IsString, IsNotEmpty, IsIn, IsNumber, IsPositive, IsInt, IsOptional, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePoolDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['token', 'nft', 'merch', 'exclusive_content'])
  rewardType: string;

  @IsString()
  @IsOptional()
  rewardDescription?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  totalReward: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  durationDays: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  topN: number;

  @IsArray()
  @IsOptional()
  tiers?: { rank: number; amount: number }[];

  @IsString()
  @IsOptional()
  walletAddress?: string;

  @IsString()
  @IsOptional()
  contractAddress?: string;
}
