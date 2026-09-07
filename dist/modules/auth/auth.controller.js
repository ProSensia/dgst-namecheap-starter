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
const config_1 = require("@nestjs/config");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
let AuthController = class AuthController {
    constructor(authService, config) {
        this.authService = authService;
        this.config = config;
    }
    async register(dto, req) {
        return this.authService.register(dto, req.ip);
    }
    async login(dto, res) {
        const user = await this.authService.validateCredentials(dto);
        const tokens = await this.authService.issueTokens(user.id);
        this.setAuthCookies(res, tokens);
        return { id: user.id, email: user.email, fullName: user.fullName };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.['refresh_token'];
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('No refresh token provided');
        }
        const tokens = await this.authService.rotateRefreshToken(refreshToken);
        this.setAuthCookies(res, tokens);
        return { ok: true };
    }
    async logout(req, res) {
        const refreshToken = req.cookies?.['refresh_token'];
        if (refreshToken) {
            await this.authService.revokeRefreshToken(refreshToken);
        }
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.clearCookie('csrf_token');
        return { ok: true };
    }
    async me(user) {
        return { ...user, permissions: Array.from(user.permissions) };
    }
    setAuthCookies(res, tokens) {
        const isProd = this.config.get('NODE_ENV') === 'production';
        const common = { secure: isProd, sameSite: 'lax', path: '/' };
        res.cookie('access_token', tokens.accessToken, { ...common, httpOnly: true, maxAge: 15 * 60 * 1000 });
        res.cookie('refresh_token', tokens.refreshToken, { ...common, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.cookie('csrf_token', tokens.csrfToken, { ...common, httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map