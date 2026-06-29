import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ArtistGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.session?.user || req.session.user.role !== 'artist') {
      throw new UnauthorizedException('Artist login required');
    }
    return true;
  }
}
