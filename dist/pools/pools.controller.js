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
exports.PoolsController = void 0;
const common_1 = require("@nestjs/common");
const pools_service_1 = require("./pools.service");
const create_pool_dto_1 = require("./dto/create-pool.dto");
const artist_guard_1 = require("../common/guards/artist.guard");
const fan_guard_1 = require("../common/guards/fan.guard");
require("../common/types/session.types");
let PoolsController = class PoolsController {
    constructor(poolsService) {
        this.poolsService = poolsService;
    }
    findAll() {
        return this.poolsService.findAllActive();
    }
    myPools(req) {
        return this.poolsService.findByArtist(req.session.user.spotifyId);
    }
    findOne(id) {
        return this.poolsService.findOne(id);
    }
    create(dto, req) {
        return this.poolsService.create(dto, req.session.user);
    }
    join(id) {
        return this.poolsService.join(id);
    }
    close(id, req) {
        return this.poolsService.close(id, req.session.user.spotifyId);
    }
};
exports.PoolsController = PoolsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PoolsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_1.UseGuards)(artist_guard_1.ArtistGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PoolsController.prototype, "myPools", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PoolsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(artist_guard_1.ArtistGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pool_dto_1.CreatePoolDto, Object]),
    __metadata("design:returntype", void 0)
], PoolsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.UseGuards)(fan_guard_1.FanGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PoolsController.prototype, "join", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, common_1.UseGuards)(artist_guard_1.ArtistGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PoolsController.prototype, "close", null);
exports.PoolsController = PoolsController = __decorate([
    (0, common_1.Controller)('pools'),
    __metadata("design:paramtypes", [pools_service_1.PoolsService])
], PoolsController);
//# sourceMappingURL=pools.controller.js.map