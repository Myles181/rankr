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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_guard_1 = require("../common/guards/auth.guard");
require("../common/types/session.types");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    fanLogin(res) {
        return res.redirect(this.authService.buildAuthUrl('fan'));
    }
    artistLogin(res) {
        return res.redirect(this.authService.buildAuthUrl('artist'));
    }
    async fanCallback(code, error, req, res) {
        if (error) {
            return res.redirect(`${this.authService.frontendBaseUrl}/auth-error?msg=${error}`);
        }
        try {
            req.session.user = await this.authService.handleCallback(code, 'fan');
            return res.redirect(`${this.authService.frontendBaseUrl}/fan/dashboard`);
        }
        catch (err) {
            const msg = err instanceof common_1.UnauthorizedException ? err.message : 'server_error';
            return res.redirect(`${this.authService.frontendBaseUrl}/auth-error?msg=${msg}`);
        }
    }
    async artistCallback(code, error, req, res) {
        if (error) {
            return res.redirect(`${this.authService.frontendBaseUrl}/auth-error?msg=${error}`);
        }
        try {
            req.session.user = await this.authService.handleCallback(code, 'artist');
            const dest = req.session.user.artistVerified ? '/artist/dashboard' : '/artist/verify';
            return res.redirect(`${this.authService.frontendBaseUrl}${dest}`);
        }
        catch (err) {
            return res.redirect(`${this.authService.frontendBaseUrl}/auth-error?msg=server_error`);
        }
    }
    me(req) {
        const { accessToken, refreshToken, ...safe } = req.session.user;
        return safe;
    }
    logout(req, res) {
        req.session.destroy(() => { });
        return res.json({ success: true });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('spotify/fan'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "fanLogin", null);
__decorate([
    (0, common_1.Get)('spotify/artist'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "artistLogin", null);
__decorate([
    (0, common_1.Get)('spotify/callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('error')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "fanCallback", null);
__decorate([
    (0, common_1.Get)('spotify/artist/callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('error')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "artistCallback", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map