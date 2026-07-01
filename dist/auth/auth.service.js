"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_PROFILE_URL = 'https://api.spotify.com/v1/me';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';
const FAN_SCOPES = 'user-read-email user-read-private user-read-recently-played';
const ARTIST_SCOPES = 'user-read-email user-read-private';
let AuthService = class AuthService {
    constructor(config) {
        this.config = config;
        this.clientId = config.get('SPOTIFY_CLIENT_ID');
        this.clientSecret = config.get('SPOTIFY_CLIENT_SECRET');
        this.fanRedirectUri = config.get('SPOTIFY_REDIRECT_URI');
        this.artistRedirectUri = config.get('SPOTIFY_ARTIST_REDIRECT_URI');
        this.frontendUrl = config.get('FRONTEND_URL') || 'http://localhost:4000';
    }
    buildAuthUrl(role) {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            scope: role === 'fan' ? FAN_SCOPES : ARTIST_SCOPES,
            redirect_uri: role === 'fan' ? this.fanRedirectUri : this.artistRedirectUri,
            state: role,
            show_dialog: 'true',
        });
        return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
    }
    async handleCallback(code, role) {
        const redirectUri = role === 'fan' ? this.fanRedirectUri : this.artistRedirectUri;
        const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const tokenRes = await axios_1.default.post(SPOTIFY_TOKEN_URL, new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth}` } });
        const { access_token, refresh_token } = tokenRes.data;
        const profileRes = await axios_1.default.get(SPOTIFY_PROFILE_URL, {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const profile = profileRes.data;
        if (role === 'fan') {
            if (profile.product !== 'premium') {
                throw new common_1.UnauthorizedException('premium_required');
            }
            return {
                role: 'fan',
                spotifyId: profile.id,
                displayName: profile.display_name,
                email: profile.email ?? null,
                avatar: profile.images?.[0]?.url ?? null,
                isPremium: true,
                accessToken: access_token,
                refreshToken: refresh_token,
            };
        }
        const searchRes = await axios_1.default.get(`${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(profile.display_name)}&type=artist&limit=5`, { headers: { Authorization: `Bearer ${access_token}` } });
        const MIN_FOLLOWERS = 100;
        const artists = searchRes.data.artists?.items ?? [];
        const matchedArtist = artists.find((a) => a.name.toLowerCase() === profile.display_name.toLowerCase() &&
            (a.followers?.total ?? 0) >= MIN_FOLLOWERS);
        return {
            role: 'artist',
            spotifyId: profile.id,
            displayName: profile.display_name,
            email: profile.email ?? null,
            avatar: profile.images?.[0]?.url ?? null,
            spotifyArtistId: matchedArtist?.id ?? null,
            artistVerified: !!matchedArtist,
            followers: matchedArtist?.followers?.total ?? 0,
            accessToken: access_token,
            refreshToken: refresh_token,
        };
    }
    get frontendBaseUrl() {
        return this.frontendUrl;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map