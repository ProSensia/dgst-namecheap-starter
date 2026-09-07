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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roleSelect = {
    id: true,
    name: true,
    description: true,
    isSystem: true,
    createdAt: true,
    permissions: { select: { permission: true } },
};
let RolesService = class RolesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    listPermissionCatalog() {
        return this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
    }
    list() {
        return this.prisma.role.findMany({ select: roleSelect, orderBy: { name: 'asc' } });
    }
    async findOne(id) {
        const role = await this.prisma.role.findUnique({ where: { id }, select: roleSelect });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async create(dto, actor, ipAddress) {
        const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
        if (existing)
            throw new common_1.ConflictException('A role with this name already exists');
        const role = await this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                permissions: dto.permissionIds ? { create: dto.permissionIds.map((permissionId) => ({ permissionId })) } : undefined,
            },
            select: roleSelect,
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'ROLE_CREATED',
            entityType: 'Role',
            entityId: role.id,
            newValue: role,
            ipAddress,
        });
        return role;
    }
    async update(id, dto, actor, ipAddress) {
        const before = await this.findOne(id);
        const role = await this.prisma.role.update({ where: { id }, data: dto, select: roleSelect });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'ROLE_UPDATED',
            entityType: 'Role',
            entityId: id,
            previousValue: before,
            newValue: role,
            ipAddress,
        });
        return role;
    }
    async setPermissions(id, dto, actor, ipAddress) {
        const before = await this.findOne(id);
        const permissions = await this.prisma.permission.findMany({ where: { id: { in: dto.permissionIds } } });
        if (permissions.length !== dto.permissionIds.length) {
            throw new common_1.BadRequestException('One or more permissionIds are invalid');
        }
        const role = await this.prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleId: id } });
            await tx.rolePermission.createMany({ data: dto.permissionIds.map((permissionId) => ({ roleId: id, permissionId })) });
            return tx.role.findUnique({ where: { id }, select: roleSelect });
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'ROLE_PERMISSIONS_UPDATED',
            entityType: 'Role',
            entityId: id,
            previousValue: before.permissions,
            newValue: role?.permissions,
            ipAddress,
        });
        return role;
    }
    async remove(id, actor, ipAddress) {
        const role = await this.findOne(id);
        if (role.isSystem) {
            throw new common_1.ForbiddenException('System roles cannot be deleted');
        }
        await this.prisma.role.delete({ where: { id } });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'ROLE_DELETED',
            entityType: 'Role',
            entityId: id,
            previousValue: role,
            ipAddress,
        });
        return { ok: true };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RolesService);
//# sourceMappingURL=roles.service.js.map