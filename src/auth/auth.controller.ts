import { Controller, Get, Post, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { ArtistGuard } from '../common/guards/artist.guard';
import '../common/types/session.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('spotify/fan')
  fanLogin(@Res() res: Response) {
    return res.redirect(this.authService.buildAuthUrl('fan'));
  }

  @Get('spotify/artist')
  artistLogin(@Res() res: Response) {
    return res.redirect(this.authService.buildAuthUrl('artist'));
  }

  @Get('spotify/callback')
  async fanCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (error) {
      return res.redirect(`${this.authService.frontendBaseUrl}/auth-error?msg=${error}`);
    }
    try {
      req.session.user = await this.authService.handleCallback(code, 'fan');
      return res.redirect(`${this.authService.frontendBaseUrl}/fan/dashboard`);
    } catch (err) {
      const msg = err instanceof UnauthorizedException ? err.message : 'server_error';
      return res.redirect(`${this.authService.frontendBaseUrl}/auth-error?msg=${msg}`);
    }
  }

  @Get('spotify/artist/callback')
  async artistCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (error) {
      return res.redirect(`${this.authService.frontendBaseUrl}/auth-error?msg=${error}`);
    }
    try {
      req.session.user = await this.authService.handleCallback(code, 'artist');
      const dest = req.session.user.artistVerified ? '/artist/dashboard' : '/artist/verify';
      return res.redirect(`${this.authService.frontendBaseUrl}${dest}`);
    } catch (err) {
      return res.redirect(`${this.authService.frontendBaseUrl}/auth-error?msg=server_error`);
    }
  }

  @Get('spotify/tracks/search')
  @UseGuards(ArtistGuard)
  searchTracks(@Query('q') q: string, @Req() req: Request) {
    if (!q || q.trim().length < 2) return [];
    const { accessToken, spotifyArtistId, displayName } = req.session.user;
    return this.authService.searchArtistTracks(q, accessToken, spotifyArtistId ?? null, displayName);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: Request) {
    const { accessToken, refreshToken, ...safe } = req.session.user;
    return safe;
  }

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy(() => {});
    return res.json({ success: true });
  }
}
