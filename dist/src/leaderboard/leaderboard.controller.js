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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardController = void 0;
const common_1 = require("@nestjs/common");
const leaderboard_service_1 = require("./leaderboard.service");
const sync_score_dto_1 = require("./dto/sync-score.dto");
const auth_guard_1 = require("../common/guards/auth.guard");
const fan_guard_1 = require("../common/guards/fan.guard");
require("../common/types/session.types");
let LeaderboardController = class LeaderboardController {
    constructor(leaderboardService) {
        this.leaderboardService = leaderboardService;
    }
    getRanked(poolId) {
        return this.leaderboardService.getRanked(poolId);
    }
    myScore(poolId, req) {
        return this.leaderboardService.getMyScore(poolId, req.session.user.spotifyId);
    }
    syncScore(poolId, dto, req) {
        return this.leaderboardService.syncScore(poolId, dto.artistId, req.session.user);
    }
};
exports.LeaderboardController = LeaderboardController;
__decorate([
    (0, common_1.Get)(':poolId'),
    __param(0, (0, common_1.Param)('poolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "getRanked", null);
__decorate([
    (0, common_1.Get)(':poolId/me'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Param)('poolId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "myScore", null);
__decorate([
    (0, common_1.Post)(':poolId/sync'),
    (0, common_1.UseGuards)(fan_guard_1.FanGuard),
    __param(0, (0, common_1.Param)('poolId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sync_score_dto_1.SyncScoreDto, Object]),
    __metadata("design:returntype", void 0)
], LeaderboardController.prototype, "syncScore", null);
exports.LeaderboardController = LeaderboardController = __decorate([
    (0, common_1.Controller)('leaderboard'),
    __metadata("design:paramtypes", [leaderboard_service_1.LeaderboardService])
], LeaderboardController);
//# sourceMappingURL=leaderboard.controller.js.map