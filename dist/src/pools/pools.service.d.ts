import { Pool } from './interfaces/pool.interface';
import { CreatePoolDto } from './dto/create-pool.dto';
import { SessionUser } from '../common/types/session.types';
export declare class PoolsService {
    private pools;
    private idCounter;
    findAllActive(): Pool[];
    findOne(id: number): Pool;
    findByArtist(spotifyId: string): Pool[];
    create(dto: CreatePoolDto, artist: SessionUser): Pool;
    join(id: number): Pool;
    close(id: number, artistSpotifyId: string): Pool;
}
