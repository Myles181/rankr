import { Module } from '@nestjs/common';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:     [AuthModule],
  controllers: [PoolsController],
  providers:   [PoolsService],
})
export class PoolsModule {}
