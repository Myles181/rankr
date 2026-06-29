import { IsString, IsNotEmpty } from 'class-validator';

export class SyncScoreDto {
  @IsString()
  @IsNotEmpty()
  artistId: string;
}
