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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const request_user_type_1 = require("../../common/types/request-user.type");
const permission_catalog_1 = require("../../common/permissions/permission-catalog");
const project_code_util_1 = require("../projects/project-code.util");
const applicationInclude = {
    program: { select: { id: true, code: true, title: true, status: true } },
    fundingCategory: true,
    applicant: { select: { id: true, institutionName: true, user: { select: { fullName: true, email: true } } } },
};
let ApplicationsService = class ApplicationsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async listMine(actor) {
        if (!actor.applicantProfileId)
            throw new common_1.ForbiddenException('This account has no applicant profile');
        return this.prisma.application.findMany({
            where: { applicantId: actor.applicantProfileId },
            include: applicationInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    listAll(filters) {
        return this.prisma.application.findMany({
            where: {
                programId: filters.programId,
                status: filters.status,
            },
            include: applicationInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneForActor(id, actor) {
        const application = await this.prisma.application.findUnique({ where: { id }, include: applicationInclude });
        if (!application)
            throw new common_1.NotFoundException('Application not found');
        this.assertViewAccess(application, actor);
        return application;
    }
    assertViewAccess(application, actor) {
        const isOwner = actor.applicantProfileId && actor.applicantProfileId === application.applicantId;
        const isStaff = actor.isSuperAdmin || actor.permissions.has((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.APPLICATION, 'VIEW'));
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('You do not have access to this application');
        }
    }
    async create(dto, actor, ipAddress) {
        if (!actor.applicantProfileId)
            throw new common_1.ForbiddenException('This account has no applicant profile');
        const program = await this.prisma.program.findUnique({ where: { id: dto.programId } });
        if (!program)
            throw new common_1.NotFoundException('Program not found');
        if (program.status !== 'PUBLISHED')
            throw new common_1.BadRequestException('This program is not currently accepting applications');
        if (program.applicationDeadline && program.applicationDeadline < new Date()) {
            throw new common_1.BadRequestException('The application deadline for this program has passed');
        }
        if (dto.fundingCategoryId) {
            const category = await this.prisma.fundingCategory.findFirst({
                where: { id: dto.fundingCategoryId, programId: dto.programId },
            });
            if (!category)
                throw new common_1.BadRequestException('Invalid funding category for this program');
            if (dto.requestedAmount < Number(category.minAmount) || dto.requestedAmount > Number(category.maxAmount)) {
                throw new common_1.BadRequestException(`Requested amount must be between ${category.minAmount} and ${category.maxAmount} for this funding category`);
            }
        }
        const application = await this.prisma.application.create({
            data: {
                programId: dto.programId,
                applicantId: actor.applicantProfileId,
                fundingCategoryId: dto.fundingCategoryId,
                title: dto.title,
                summary: dto.summary,
                requestedAmount: dto.requestedAmount,
                status: 'SUBMITTED',
                submittedAt: new Date(),
            },
            include: applicationInclude,
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'APPLICATION_SUBMITTED',
            entityType: 'Application',
            entityId: application.id,
            newValue: { programId: dto.programId, title: dto.title, requestedAmount: dto.requestedAmount },
            ipAddress,
        });
        return application;
    }
    async decide(id, dto, actor, ipAddress) {
        const application = await this.prisma.application.findUnique({ where: { id }, include: { program: true } });
        if (!application)
            throw new common_1.NotFoundException('Application not found');
        const result = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.application.update({
                where: { id },
                data: {
                    status: dto.decision,
                    decisionAt: new Date(),
                    decisionByUserId: actor.id,
                    decisionRemarks: dto.remarks,
                },
            });
            let project = null;
            if (dto.decision === 'APPROVED') {
                const projectCode = await (0, project_code_util_1.nextProjectCode)(tx, application.programId, application.program.code);
                const approvedAmount = dto.approvedAmount ?? Number(application.requestedAmount);
                const applicantProfile = await tx.applicantProfile.findUniqueOrThrow({ where: { id: application.applicantId } });
                project = await tx.project.create({
                    data: {
                        projectCode,
                        applicationId: application.id,
                        programId: application.programId,
                        principalInvestigatorId: applicantProfile.userId,
                        title: application.title,
                        status: 'APPROVED',
                        approvedAmount,
                    },
                });
                await tx.projectStatusHistory.create({
                    data: {
                        projectId: project.id,
                        fromStatus: null,
                        toStatus: 'APPROVED',
                        changedByUserId: actor.id,
                        remarks: 'Application approved; award project created',
                    },
                });
            }
            return { application: updated, project };
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'APPLICATION_DECIDED',
            entityType: 'Application',
            entityId: id,
            previousValue: { status: application.status },
            newValue: { status: dto.decision, remarks: dto.remarks, projectId: result.project?.id },
            ipAddress,
        });
        return result;
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map