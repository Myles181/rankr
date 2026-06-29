import { Controller, Get, Post, Body, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PoolsService } from './pools.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import { ArtistGuard } from '../common/guards/artist.guard';
import { FanGuard } from '../common/guards/fan.guard';
import '../common/types/session.types';

@Controller('pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get()
  findAll() {
    return this.poolsService.findAllActive();
  }

  @Get('mine')
  @UseGuards(ArtistGuard)
  myPools(@Req() req: Request) {
    return this.poolsService.findByArtist(req.session.user.spotifyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.poolsService.findOne(id);
  }

  @Post()
  @UseGuards(ArtistGuard)
  create(@Body() dto: CreatePoolDto, @Req() req: Request) {
    return this.poolsService.create(dto, req.session.user);
  }

  @Post(':id/join')
  @UseGuards(FanGuard)
  join(@Param('id', ParseIntPipe) id: number) {
    return this.poolsService.join(id);
  }

  @Post(':id/close')
  @UseGuards(ArtistGuard)
  close(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.poolsService.close(id, req.session.user.spotifyId);
  }
}
