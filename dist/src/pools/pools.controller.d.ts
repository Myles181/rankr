import { Request } from 'express';
import { PoolsService } from './pools.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import '../common/types/session.types';
export declare class PoolsController {
    private readonly poolsService;
    constructor(poolsService: PoolsService);
    findAll(): import("./interfaces/pool.interface").Pool[];
    myPools(req: Request): import("./interfaces/pool.interface").Pool[];
    findOne(id: number): import("./interfaces/pool.interface").Pool;
    create(dto: CreatePoolDto, req: Request): import("./interfaces/pool.interface").Pool;
    join(id: number): import("./interfaces/pool.interface").Pool;
    close(id: number, req: Request): import("./interfaces/pool.interface").Pool;
}
