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
exports.ApplicantCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
let ApplicantCategoriesService = class ApplicantCategoriesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    listActive() {
        return this.prisma.applicantCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    }
    listAll() {
        return this.prisma.applicantCategory.findMany({ orderBy: { name: 'asc' } });
    }
    async create(dto, actor, ipAddress) {
        const existing = await this.prisma.applicantCategory.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException('A category with this code already exists');
        const category = await this.prisma.applicantCategory.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                profileFieldSchema: dto.profileFieldSchema,
                isActive: dto.isActive ?? true,
            },
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'APPLICANT_CATEGORY_CREATED',
            entityType: 'ApplicantCategory',
            entityId: category.id,
            newValue: category,
            ipAddress,
        });
        return category;
    }
    async update(id, dto, actor, ipAddress) {
        const before = await this.prisma.applicantCategory.findUnique({ where: { id } });
        if (!before)
            throw new common_1.NotFoundException('Applicant category not found');
        const category = await this.prisma.applicantCategory.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                profileFieldSchema: dto.profileFieldSchema,
                isActive: dto.isActive,
            },
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'APPLICANT_CATEGORY_UPDATED',
            entityType: 'ApplicantCategory',
            entityId: id,
            previousValue: before,
            newValue: category,
            ipAddress,
        });
        return category;
    }
};
exports.ApplicantCategoriesService = ApplicantCategoriesService;
exports.ApplicantCategoriesService = ApplicantCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ApplicantCategoriesService);
//# sourceMappingURL=applicant-categories.service.js.map