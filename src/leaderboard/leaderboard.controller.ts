import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { LeaderboardService } from './leaderboard.service';
import { SyncScoreDto } from './dto/sync-score.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { FanGuard } from '../common/guards/fan.guard';
import '../common/types/session.types';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get(':poolId')
  getRanked(@Param('poolId') poolId: string) {
    return this.leaderboardService.getRanked(poolId);
  }

  @Get(':poolId/me')
  @UseGuards(AuthGuard)
  myScore(@Param('poolId') poolId: string, @Req() req: Request) {
    return this.leaderboardService.getMyScore(poolId, req.session.user.spotifyId);
  }

  @Post(':poolId/sync')
  @UseGuards(FanGuard)
  syncScore(
    @Param('poolId') poolId: string,
    @Body() dto: SyncScoreDto,
    @Req() req: Request,
  ) {
    return this.leaderboardService.syncScore(poolId, dto.artistId, req.session.user);
  }
}
