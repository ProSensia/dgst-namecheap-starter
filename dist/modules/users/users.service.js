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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const userListSelect = {
    id: true,
    email: true,
    fullName: true,
    status: true,
    isSuperAdmin: true,
    createdAt: true,
    roles: { select: { role: { select: { id: true, name: true } } } },
};
let UsersService = class UsersService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    list() {
        return this.prisma.user.findMany({ select: userListSelect, orderBy: { createdAt: 'desc' } });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: userListSelect });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async createStaff(dto, actor, ipAddress) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('An account with this email already exists');
        const roles = await this.prisma.role.findMany({ where: { id: { in: dto.roleIds } } });
        if (roles.length !== dto.roleIds.length)
            throw new common_1.BadRequestException('One or more roleIds are invalid');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                fullName: dto.fullName,
                roles: { create: dto.roleIds.map((roleId) => ({ roleId })) },
            },
            select: userListSelect,
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'STAFF_USER_CREATED',
            entityType: 'User',
            entityId: user.id,
            newValue: { email: user.email, roleIds: dto.roleIds },
            ipAddress,
        });
        return user;
    }
    async update(id, dto, actor, ipAddress) {
        const before = await this.findOne(id);
        if (dto.roleIds) {
            const roles = await this.prisma.role.findMany({ where: { id: { in: dto.roleIds } } });
            if (roles.length !== dto.roleIds.length)
                throw new common_1.BadRequestException('One or more roleIds are invalid');
        }
        const user = await this.prisma.$transaction(async (tx) => {
            if (dto.roleIds) {
                await tx.userRole.deleteMany({ where: { userId: id } });
                await tx.userRole.createMany({ data: dto.roleIds.map((roleId) => ({ userId: id, roleId })) });
            }
            return tx.user.update({
                where: { id },
                data: {
                    fullName: dto.fullName,
                    status: dto.status,
                },
                select: userListSelect,
            });
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'USER_UPDATED',
            entityType: 'User',
            entityId: id,
            previousValue: before,
            newValue: user,
            ipAddress,
        });
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map