import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import '../common/types/session.types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    fanLogin(res: Response): void;
    artistLogin(res: Response): void;
    fanCallback(code: string, error: string, req: Request, res: Response): Promise<void>;
    artistCallback(code: string, error: string, req: Request, res: Response): Promise<void>;
    me(req: Request): {
        role: "fan" | "artist";
        spotifyId: string;
        displayName: string;
        email: string | null;
        avatar: string | null;
        isPremium?: boolean;
        spotifyArtistId?: string | null;
        artistVerified?: boolean;
        followers?: number;
    };
    logout(req: Request, res: Response): Response<any, Record<string, any>>;
}
