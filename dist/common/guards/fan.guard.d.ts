import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class FanGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
