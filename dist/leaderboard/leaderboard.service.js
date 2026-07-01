"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let LeaderboardService = class LeaderboardService {
    constructor() {
        this.scores = {};
        this.CREDIT_PER_PLAY_SECONDS = 180;
        this.MIN_TRACK_MS = 30 * 1000;
    }
    getRanked(poolId) {
        const poolScores = this.scores[poolId] ?? {};
        return Object.entries(poolScores)
            .map(([spotifyId, data]) => ({ spotifyId, ...data }))
            .sort((a, b) => b.score - a.score)
            .map((entry, i) => ({ ...entry, rank: i + 1 }));
    }
    getMyScore(poolId, spotifyId) {
        const poolScores = this.scores[poolId] ?? {};
        const myData = poolScores[spotifyId];
        if (!myData) {
            return { score: 0, rank: null, message: "No data yet — start streaming!" };
        }
        const ranked = this.getRanked(poolId);
        const myRank = ranked.findIndex(e => e.spotifyId === spotifyId) + 1;
        return {
            score: myData.score,
            rank: myRank,
            totalFans: ranked.length,
            formatted: this.formatTime(myData.score),
        };
    }
    async syncScore(poolId, artistId, user) {
        const { accessToken, spotifyId, displayName, avatar } = user;
        const resp = await axios_1.default.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers: { Authorization: `Bearer ${accessToken}` } });
        const items = resp.data.items ?? [];
        let newScore = 0;
        for (const item of items) {
            const track = item.track;
            const isThisArtist = track.artists?.some((a) => a.id === artistId);
            if (!isThisArtist)
                continue;
            if ((track.duration_ms ?? 0) >= this.MIN_TRACK_MS) {
                newScore += this.CREDIT_PER_PLAY_SECONDS;
            }
        }
        if (!this.scores[poolId])
            this.scores[poolId] = {};
        const existing = this.scores[poolId][spotifyId];
        if (!existing || newScore > existing.score) {
            this.scores[poolId][spotifyId] = {
                score: newScore,
                displayName,
                avatar,
                lastUpdated: new Date().toISOString(),
            };
        }
        const ranked = this.getRanked(poolId);
        const myRank = ranked.findIndex(e => e.spotifyId === spotifyId) + 1;
        return {
            success: true,
            score: this.scores[poolId][spotifyId].score,
            rank: myRank,
            totalFans: ranked.length,
        };
    }
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)()
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map