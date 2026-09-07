"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const form_schema_validator_1 = require("../../common/form-schema/form-schema.validator");
let AuthService = class AuthService {
    constructor(prisma, jwt, config, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.audit = audit;
    }
    async register(dto, ipAddress) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const category = await this.prisma.applicantCategory.findUnique({ where: { code: dto.categoryCode } });
        if (!category || !category.isActive) {
            throw new common_1.BadRequestException('Unknown or inactive applicant category');
        }
        (0, form_schema_validator_1.validateDataAgainstSchema)(dto.profileData ?? {}, category.profileFieldSchema);
        const applicantRole = await this.prisma.role.findUnique({ where: { name: 'Applicant' } });
        if (!applicantRole) {
            throw new common_1.BadRequestException('System is not seeded correctly: missing Applicant role');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                fullName: dto.fullName,
                phone: dto.phone,
                roles: { create: { roleId: applicantRole.id } },
                applicantProfile: {
                    create: {
                        categoryId: category.id,
                        institutionName: dto.institutionName,
                        department: dto.department,
                        profileData: dto.profileData ?? {},
                    },
                },
            },
        });
        await this.audit.log({
            actorUserId: user.id,
            action: 'USER_REGISTERED',
            entityType: 'User',
            entityId: user.id,
            newValue: { email: user.email, categoryCode: dto.categoryCode },
            ipAddress,
        });
        return { id: user.id, email: user.email };
    }
    async validateCredentials(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        return user;
    }
    async issueTokens(userId) {
        const accessToken = this.jwt.sign({ sub: userId }, { secret: this.config.get('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_TTL', '15m') });
        const jti = (0, crypto_1.randomUUID)();
        const refreshToken = this.jwt.sign({ sub: userId, jti }, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_TTL', '7d') });
        const decoded = this.jwt.decode(refreshToken);
        await this.prisma.refreshToken.create({
            data: {
                id: jti,
                userId,
                tokenHash: this.hashToken(refreshToken),
                expiresAt: new Date(decoded.exp * 1000),
            },
        });
        const csrfToken = (0, crypto_1.randomUUID)();
        return { accessToken, refreshToken, csrfToken };
    }
    async rotateRefreshToken(refreshToken) {
        let payload;
        try {
            payload = this.jwt.verify(refreshToken, { secret: this.config.get('JWT_REFRESH_SECRET') });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
        if (!stored || stored.revokedAt || stored.tokenHash !== this.hashToken(refreshToken) || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token is no longer valid');
        }
        await this.prisma.refreshToken.update({ where: { id: payload.jti }, data: { revokedAt: new Date() } });
        return this.issueTokens(payload.sub);
    }
    async revokeRefreshToken(refreshToken) {
        try {
            const payload = this.jwt.decode(refreshToken);
            if (payload?.jti) {
                await this.prisma.refreshToken.updateMany({
                    where: { id: payload.jti, revokedAt: null },
                    data: { revokedAt: new Date() },
                });
            }
        }
        catch {
        }
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map