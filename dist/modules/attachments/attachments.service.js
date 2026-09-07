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
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const storage_service_1 = require("../../common/storage/storage.service");
const request_user_type_1 = require("../../common/types/request-user.type");
const permission_catalog_1 = require("../../common/permissions/permission-catalog");
const MAX_FILE_BYTES = 25 * 1024 * 1024;
let AttachmentsService = class AttachmentsService {
    constructor(prisma, audit, storage) {
        this.prisma = prisma;
        this.audit = audit;
        this.storage = storage;
    }
    async resolveProjectId(ownerType, ownerId) {
        switch (ownerType) {
            case 'PROJECT':
                return ownerId;
            case 'REPORT': {
                const report = await this.prisma.report.findUnique({ where: { id: ownerId }, select: { projectId: true } });
                return report?.projectId ?? null;
            }
            case 'AWARD_LETTER': {
                const letter = await this.prisma.awardLetter.findUnique({ where: { id: ownerId }, select: { projectId: true } });
                return letter?.projectId ?? null;
            }
            case 'EXPENSE': {
                const expense = await this.prisma.expense.findUnique({ where: { id: ownerId }, select: { projectId: true } });
                return expense?.projectId ?? null;
            }
            case 'LEGAL_DOCUMENT': {
                const doc = await this.prisma.legalDocument.findUnique({ where: { id: ownerId }, select: { projectId: true } });
                return doc?.projectId ?? null;
            }
            case 'PROGRESS_UPDATE': {
                const update = await this.prisma.progressUpdate.findUnique({ where: { id: ownerId }, select: { projectId: true } });
                return update?.projectId ?? null;
            }
            default:
                return null;
        }
    }
    async assertAccess(ownerType, ownerId, actor, action) {
        if (actor.isSuperAdmin || actor.permissions.has((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.ATTACHMENT, action))) {
            return;
        }
        const projectId = await this.resolveProjectId(ownerType, ownerId);
        if (projectId) {
            const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { principalInvestigatorId: true } });
            if (project && project.principalInvestigatorId === actor.id) {
                return;
            }
        }
        throw new common_1.ForbiddenException('You do not have access to this document');
    }
    async upload(ownerType, ownerId, category, file, actor, ipAddress) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        if (file.size > MAX_FILE_BYTES)
            throw new common_1.BadRequestException('File exceeds the 25MB upload limit');
        await this.assertAccess(ownerType, ownerId, actor, 'CREATE');
        const stored = await this.storage.save(file.buffer, file.originalname);
        const previousVersion = await this.prisma.attachment.findFirst({
            where: { ownerType, ownerId, category },
            orderBy: { version: 'desc' },
        });
        const attachment = await this.prisma.attachment.create({
            data: {
                ownerType,
                ownerId,
                category,
                originalFilename: file.originalname,
                storageKey: stored.storageKey,
                mimeType: file.mimetype,
                sizeBytes: stored.sizeBytes,
                checksumSha256: stored.checksumSha256,
                version: (previousVersion?.version ?? 0) + 1,
                uploadedByUserId: actor.id,
            },
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'ATTACHMENT_UPLOADED',
            entityType: 'Attachment',
            entityId: attachment.id,
            newValue: { ownerType, ownerId, category, originalFilename: file.originalname, checksumSha256: stored.checksumSha256 },
            ipAddress,
        });
        return attachment;
    }
    async listForOwner(ownerType, ownerId, actor) {
        await this.assertAccess(ownerType, ownerId, actor, 'DOWNLOAD');
        return this.prisma.attachment.findMany({ where: { ownerType, ownerId }, orderBy: { createdAt: 'desc' } });
    }
    async getForDownload(id, actor, ipAddress) {
        const attachment = await this.prisma.attachment.findUnique({ where: { id } });
        if (!attachment)
            throw new common_1.NotFoundException('Document not found');
        await this.assertAccess(attachment.ownerType, attachment.ownerId, actor, 'DOWNLOAD');
        if (!(await this.storage.exists(attachment.storageKey))) {
            throw new common_1.NotFoundException('Document file is missing from storage');
        }
        await this.audit.log({
            actorUserId: actor.id,
            action: 'ATTACHMENT_DOWNLOADED',
            entityType: 'Attachment',
            entityId: attachment.id,
            ipAddress,
        });
        const stream = await this.storage.readStream(attachment.storageKey);
        return { attachment, stream };
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        storage_service_1.StorageService])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map