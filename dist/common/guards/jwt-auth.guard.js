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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../decorators/public.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const request_user_type_1 = require("../types/request-user.type");
let JwtAuthGuard = class JwtAuthGuard {
    constructor(reflector, jwt, config, prisma) {
        this.reflector = reflector;
        this.jwt = jwt;
        this.config = config;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.['access_token'];
        if (isPublic && !token) {
            return true;
        }
        if (!token) {
            throw new common_1.UnauthorizedException('Not authenticated');
        }
        let payload;
        try {
            payload = this.jwt.verify(token, { secret: this.config.get('JWT_ACCESS_SECRET') });
        }
        catch {
            if (isPublic)
                return true;
            throw new common_1.UnauthorizedException('Invalid or expired session');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                applicantProfile: { select: { id: true } },
                roles: {
                    include: { role: { include: { permissions: { include: { permission: true } } } } },
                },
            },
        });
        if (!user || user.status !== 'ACTIVE') {
            if (isPublic)
                return true;
            throw new common_1.UnauthorizedException('Account not active');
        }
        const permissions = new Set();
        for (const userRole of user.roles) {
            for (const rp of userRole.role.permissions) {
                permissions.add((0, request_user_type_1.permissionKey)(rp.permission.resource, rp.permission.action));
            }
        }
        const requestUser = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            isSuperAdmin: user.isSuperAdmin,
            applicantProfileId: user.applicantProfile?.id ?? null,
            permissions,
        };
        request.user = requestUser;
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map