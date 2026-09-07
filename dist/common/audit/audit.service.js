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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const GENESIS_HASH = '0'.repeat(64);
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(input) {
        await this.prisma.$transaction(async (tx) => {
            const last = await tx.auditLog.findFirst({ orderBy: { seq: 'desc' } });
            const previousHash = last?.recordHash ?? GENESIS_HASH;
            const canonical = JSON.stringify({
                actorUserId: input.actorUserId ?? null,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId,
                previousValue: input.previousValue ?? null,
                newValue: input.newValue ?? null,
                ipAddress: input.ipAddress ?? null,
                previousHash,
            });
            const recordHash = (0, crypto_1.createHash)('sha256').update(canonical).digest('hex');
            await tx.auditLog.create({
                data: {
                    actorUserId: input.actorUserId ?? null,
                    action: input.action,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    previousValue: input.previousValue,
                    newValue: input.newValue,
                    ipAddress: input.ipAddress ?? null,
                    previousHash,
                    recordHash,
                },
            });
        });
    }
    async verifyChain() {
        const rows = await this.prisma.auditLog.findMany({ orderBy: { seq: 'asc' } });
        let previousHash = GENESIS_HASH;
        for (const row of rows) {
            const canonical = JSON.stringify({
                actorUserId: row.actorUserId,
                action: row.action,
                entityType: row.entityType,
                entityId: row.entityId,
                previousValue: row.previousValue,
                newValue: row.newValue,
                ipAddress: row.ipAddress,
                previousHash,
            });
            const expected = (0, crypto_1.createHash)('sha256').update(canonical).digest('hex');
            if (expected !== row.recordHash || row.previousHash !== previousHash) {
                return { ok: false, brokenAtSeq: row.seq };
            }
            previousHash = row.recordHash;
        }
        return { ok: true };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map