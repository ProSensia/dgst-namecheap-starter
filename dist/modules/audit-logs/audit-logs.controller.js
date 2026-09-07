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
exports.AuditLogsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const request_user_type_1 = require("../../common/types/request-user.type");
const permission_catalog_1 = require("../../common/permissions/permission-catalog");
let AuditLogsController = class AuditLogsController {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async list(entityType, entityId, actorUserId, take = '50') {
        return this.prisma.auditLog.findMany({
            where: { entityType, entityId, actorUserId },
            include: { actor: { select: { fullName: true, email: true } } },
            orderBy: { seq: 'desc' },
            take: Math.min(Number(take) || 50, 200),
        });
    }
    verifyChain() {
        return this.audit.verifyChain();
    }
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.AUDIT_LOG, 'VIEW')),
    __param(0, (0, common_1.Query)('entityType')),
    __param(1, (0, common_1.Query)('entityId')),
    __param(2, (0, common_1.Query)('actorUserId')),
    __param(3, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuditLogsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('verify-chain'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.AUDIT_LOG, 'VIEW')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "verifyChain", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, common_1.Controller)('audit-logs'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AuditLogsController);
//# sourceMappingURL=audit-logs.controller.js.map