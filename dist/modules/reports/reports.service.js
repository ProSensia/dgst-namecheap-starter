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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const verification_service_1 = require("../verification/verification.service");
const form_schema_validator_1 = require("../../common/form-schema/form-schema.validator");
const request_user_type_1 = require("../../common/types/request-user.type");
const permission_catalog_1 = require("../../common/permissions/permission-catalog");
const reportInclude = {
    project: { select: { id: true, projectCode: true, title: true, principalInvestigatorId: true, programId: true } },
    template: true,
};
const EDITABLE_STATUSES = ['DRAFT', 'CORRECTION_REQUIRED'];
let ReportsService = class ReportsService {
    constructor(prisma, audit, verification) {
        this.prisma = prisma;
        this.audit = audit;
        this.verification = verification;
    }
    assertOwnerOrStaff(project, actor, staffAction = 'VIEW') {
        const isOwner = project.principalInvestigatorId === actor.id;
        const isStaff = actor.isSuperAdmin || actor.permissions.has((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.REPORT, staffAction));
        if (!isOwner && !isStaff)
            throw new common_1.ForbiddenException('You do not have access to this report');
        return { isOwner, isStaff };
    }
    async create(dto, actor, ipAddress) {
        const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        this.assertOwnerOrStaff(project, actor, 'CREATE');
        const template = await this.prisma.reportTemplate.findUnique({ where: { id: dto.templateId } });
        if (!template || !template.isActive)
            throw new common_1.BadRequestException('Report template not found or inactive');
        if (template.programId && template.programId !== project.programId) {
            throw new common_1.BadRequestException('This report template does not apply to the project\'s program');
        }
        const report = await this.prisma.report.create({
            data: {
                projectId: dto.projectId,
                templateId: dto.templateId,
                title: dto.title ?? template.name,
                periodLabel: dto.periodLabel,
                periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
                periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
                data: {},
                status: 'DRAFT',
            },
            include: reportInclude,
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'REPORT_CREATED',
            entityType: 'Report',
            entityId: report.id,
            newValue: { projectId: dto.projectId, templateId: dto.templateId },
            ipAddress,
        });
        return report;
    }
    async listMine(actor, projectId) {
        return this.prisma.report.findMany({
            where: { project: { principalInvestigatorId: actor.id }, projectId },
            include: reportInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    listAll(filters) {
        return this.prisma.report.findMany({
            where: { projectId: filters.projectId, status: filters.status, templateId: filters.templateId },
            include: reportInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneForActor(id, actor) {
        const report = await this.prisma.report.findUnique({
            where: { id },
            include: {
                ...reportInclude,
                versions: { orderBy: { versionNumber: 'desc' } },
                comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { fullName: true } } } },
            },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        this.assertOwnerOrStaff(report.project, actor, 'VIEW');
        return report;
    }
    async update(id, dto, actor, ipAddress) {
        const report = await this.prisma.report.findUnique({ where: { id }, include: reportInclude });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        const { isOwner } = this.assertOwnerOrStaff(report.project, actor, 'EDIT');
        if (!EDITABLE_STATUSES.includes(report.status)) {
            throw new common_1.BadRequestException(`Report cannot be edited while in ${report.status} status`);
        }
        if (!isOwner && !actor.isSuperAdmin && !actor.permissions.has((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.REPORT, 'EDIT'))) {
            throw new common_1.ForbiddenException('Only the project owner or an authorized reviewer can edit this report');
        }
        const mergedData = dto.data ? { ...report.data, ...dto.data } : report.data;
        const updated = await this.prisma.report.update({
            where: { id },
            data: {
                title: dto.title,
                periodLabel: dto.periodLabel,
                periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
                periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
                data: mergedData,
            },
            include: reportInclude,
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'REPORT_DRAFT_UPDATED',
            entityType: 'Report',
            entityId: id,
            ipAddress,
        });
        return updated;
    }
    async submit(id, actor, ipAddress) {
        const report = await this.prisma.report.findUnique({ where: { id }, include: { ...reportInclude } });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        this.assertOwnerOrStaff(report.project, actor, 'EDIT');
        if (!EDITABLE_STATUSES.includes(report.status)) {
            throw new common_1.BadRequestException(`Report cannot be submitted while in ${report.status} status`);
        }
        (0, form_schema_validator_1.validateDataAgainstSchema)(report.data, report.template.fieldSchema);
        const nextVersion = report.currentVersionNumber + 1;
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.reportVersion.create({
                data: {
                    reportId: id,
                    versionNumber: nextVersion,
                    data: report.data,
                    submittedByUserId: actor.id,
                },
            });
            return tx.report.update({
                where: { id },
                data: {
                    status: 'SUBMITTED',
                    currentVersionNumber: nextVersion,
                    submittedAt: new Date(),
                    decidedAt: null,
                    decidedByUserId: null,
                    decisionRemarks: null,
                },
                include: reportInclude,
            });
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'REPORT_SUBMITTED',
            entityType: 'Report',
            entityId: id,
            newValue: { versionNumber: nextVersion },
            ipAddress,
        });
        return updated;
    }
    async markUnderReview(id, actor, ipAddress) {
        const report = await this.prisma.report.findUnique({ where: { id } });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        if (!actor.isSuperAdmin && !actor.permissions.has((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.REPORT, 'VIEW'))) {
            throw new common_1.ForbiddenException('Missing permission REPORT:VIEW');
        }
        if (report.status !== 'SUBMITTED') {
            throw new common_1.BadRequestException('Only a submitted report can be moved to under review');
        }
        const updated = await this.prisma.report.update({ where: { id }, data: { status: 'UNDER_REVIEW' } });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'REPORT_UNDER_REVIEW',
            entityType: 'Report',
            entityId: id,
            ipAddress,
        });
        return updated;
    }
    async addComment(id, dto, actor, ipAddress) {
        const report = await this.prisma.report.findUnique({ where: { id }, include: reportInclude });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        const { isOwner, isStaff } = this.assertOwnerOrStaff(report.project, actor, 'COMMUNICATE');
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('You cannot comment on this report');
        }
        const comment = await this.prisma.reportComment.create({
            data: {
                reportId: id,
                versionNumber: report.currentVersionNumber,
                authorUserId: actor.id,
                comment: dto.comment,
            },
            include: { author: { select: { fullName: true } } },
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'REPORT_COMMENT_ADDED',
            entityType: 'Report',
            entityId: id,
            ipAddress,
        });
        return comment;
    }
    async decide(id, dto, actor, ipAddress) {
        const requiredAction = dto.decision === 'APPROVED' ? 'APPROVE' : dto.decision === 'REJECTED' ? 'REJECT' : 'REQUEST_CORRECTION';
        if (!actor.isSuperAdmin && !actor.permissions.has((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.REPORT, requiredAction))) {
            throw new common_1.ForbiddenException(`Missing permission REPORT:${requiredAction}`);
        }
        const report = await this.prisma.report.findUnique({ where: { id } });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(report.status)) {
            throw new common_1.BadRequestException(`Report cannot be decided while in ${report.status} status`);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            let verificationRecordId = null;
            if (dto.decision === 'APPROVED') {
                const record = await tx.verificationRecord.create({
                    data: { entityType: 'REPORT', entityId: id, issuedByUserId: actor.id },
                });
                verificationRecordId = record.id;
            }
            return tx.report.update({
                where: { id },
                data: {
                    status: dto.decision,
                    decidedAt: new Date(),
                    decidedByUserId: actor.id,
                    decisionRemarks: dto.remarks,
                    verificationRecordId,
                },
                include: reportInclude,
            });
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'REPORT_DECIDED',
            entityType: 'Report',
            entityId: id,
            previousValue: { status: report.status },
            newValue: { status: dto.decision, remarks: dto.remarks },
            ipAddress,
        });
        return updated;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        verification_service_1.VerificationService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map