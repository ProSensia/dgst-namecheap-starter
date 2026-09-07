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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const request_user_type_1 = require("../../common/types/request-user.type");
const permission_catalog_1 = require("../../common/permissions/permission-catalog");
const verification_service_1 = require("../verification/verification.service");
const project_status_map_1 = require("./project-status.map");
const projectInclude = {
    program: { select: { id: true, code: true, title: true } },
    principalInvestigator: { select: { id: true, fullName: true, email: true } },
    awardLetter: true,
    statusHistory: { orderBy: { createdAt: 'desc' } },
};
let ProjectsService = class ProjectsService {
    constructor(prisma, audit, verification) {
        this.prisma = prisma;
        this.audit = audit;
        this.verification = verification;
    }
    listMine(actor) {
        return this.prisma.project.findMany({
            where: { principalInvestigatorId: actor.id },
            include: projectInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    listAll(filters) {
        return this.prisma.project.findMany({
            where: { status: filters.status, programId: filters.programId },
            include: projectInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    assertAccess(project, actor) {
        const isOwner = project.principalInvestigatorId === actor.id;
        const isStaff = actor.isSuperAdmin || actor.permissions.has((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.PROJECT, 'VIEW'));
        if (!isOwner && !isStaff)
            throw new common_1.ForbiddenException('You do not have access to this project');
    }
    async findOneForActor(id, actor) {
        const project = await this.prisma.project.findUnique({ where: { id }, include: projectInclude });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        this.assertAccess(project, actor);
        return project;
    }
    async transitionStatus(id, dto, actor, ipAddress) {
        if (dto.toStatus === 'AWARDED') {
            throw new common_1.BadRequestException('Use the award-letter endpoint to move a project to AWARDED');
        }
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const allowed = project_status_map_1.ALLOWED_TRANSITIONS[project.status] ?? [];
        if (!allowed.includes(dto.toStatus)) {
            throw new common_1.BadRequestException(`Cannot move project from ${project.status} to ${dto.toStatus}`);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.project.update({ where: { id }, data: { status: dto.toStatus } });
            await tx.projectStatusHistory.create({
                data: {
                    projectId: id,
                    fromStatus: project.status,
                    toStatus: dto.toStatus,
                    changedByUserId: actor.id,
                    remarks: dto.remarks,
                },
            });
            return result;
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'PROJECT_STATUS_CHANGED',
            entityType: 'Project',
            entityId: id,
            previousValue: { status: project.status },
            newValue: { status: dto.toStatus, remarks: dto.remarks },
            ipAddress,
        });
        return updated;
    }
    async issueAwardLetter(id, dto, actor, ipAddress) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.status !== 'APPROVED') {
            throw new common_1.BadRequestException('An award letter can only be issued for a project in APPROVED status');
        }
        const attachment = await this.prisma.attachment.findUnique({ where: { id: dto.attachmentId } });
        if (!attachment || attachment.ownerType !== 'PROJECT' || attachment.ownerId !== id || attachment.category !== 'AWARD_LETTER') {
            throw new common_1.BadRequestException('Invalid attachment: upload the award letter file for this project first');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const verificationRecord = await tx.verificationRecord.create({
                data: { entityType: 'AWARD_LETTER', entityId: id, issuedByUserId: actor.id },
            });
            const awardLetter = await tx.awardLetter.create({
                data: {
                    projectId: id,
                    attachmentId: attachment.id,
                    issuedByUserId: actor.id,
                    issueDate: new Date(dto.issueDate),
                },
            });
            const finalVerification = await tx.verificationRecord.update({
                where: { id: verificationRecord.id },
                data: { entityId: awardLetter.id },
            });
            await tx.awardLetter.update({ where: { id: awardLetter.id }, data: { verificationRecordId: finalVerification.id } });
            const updatedProject = await tx.project.update({ where: { id }, data: { status: 'AWARDED' } });
            await tx.projectStatusHistory.create({
                data: {
                    projectId: id,
                    fromStatus: 'APPROVED',
                    toStatus: 'AWARDED',
                    changedByUserId: actor.id,
                    remarks: 'Award letter issued',
                },
            });
            return { awardLetter, verificationRecord: finalVerification, project: updatedProject };
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'AWARD_LETTER_ISSUED',
            entityType: 'Project',
            entityId: id,
            newValue: { awardLetterId: result.awardLetter.id, verificationRecordId: result.verificationRecord.id },
            ipAddress,
        });
        return { ...result, verifyUrl: this.verification.buildVerifyUrl(result.verificationRecord.id) };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        verification_service_1.VerificationService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map