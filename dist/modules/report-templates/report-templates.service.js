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
exports.ReportTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
let ReportTemplatesService = class ReportTemplatesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    listActive(programId) {
        return this.prisma.reportTemplate.findMany({
            where: {
                isActive: true,
                OR: programId ? [{ programId }, { programId: null }] : undefined,
            },
            orderBy: { name: 'asc' },
        });
    }
    listAll() {
        return this.prisma.reportTemplate.findMany({ orderBy: { name: 'asc' } });
    }
    async findOne(id) {
        const template = await this.prisma.reportTemplate.findUnique({ where: { id } });
        if (!template)
            throw new common_1.NotFoundException('Report template not found');
        return template;
    }
    async create(dto, actor, ipAddress) {
        const existing = await this.prisma.reportTemplate.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException('A report template with this code already exists');
        const template = await this.prisma.reportTemplate.create({
            data: {
                programId: dto.programId,
                code: dto.code,
                name: dto.name,
                category: dto.category,
                periodicity: dto.periodicity,
                instructions: dto.instructions,
                fieldSchema: dto.fieldSchema,
            },
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'REPORT_TEMPLATE_CREATED',
            entityType: 'ReportTemplate',
            entityId: template.id,
            newValue: template,
            ipAddress,
        });
        return template;
    }
    async update(id, dto, actor, ipAddress) {
        const before = await this.findOne(id);
        const template = await this.prisma.reportTemplate.update({
            where: { id },
            data: {
                name: dto.name,
                category: dto.category,
                periodicity: dto.periodicity,
                instructions: dto.instructions,
                fieldSchema: dto.fieldSchema,
            },
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'REPORT_TEMPLATE_UPDATED',
            entityType: 'ReportTemplate',
            entityId: id,
            previousValue: before,
            newValue: template,
            ipAddress,
        });
        return template;
    }
};
exports.ReportTemplatesService = ReportTemplatesService;
exports.ReportTemplatesService = ReportTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ReportTemplatesService);
//# sourceMappingURL=report-templates.service.js.map