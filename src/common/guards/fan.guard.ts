import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class FanGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.session?.user || req.session.user.role !== 'fan') {
      throw new UnauthorizedException('Fan login required');
    }
    return true;
  }
}
