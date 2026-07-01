import { ConfigService } from '@nestjs/config';
import { SessionUser } from '../common/types/session.types';
export declare class AuthService {
    private config;
    private readonly clientId;
    private readonly clientSecret;
    private readonly fanRedirectUri;
    private readonly artistRedirectUri;
    private readonly frontendUrl;
    constructor(config: ConfigService);
    buildAuthUrl(role: 'fan' | 'artist'): string;
    handleCallback(code: string, role: 'fan' | 'artist'): Promise<SessionUser>;
    get frontendBaseUrl(): string;
}
