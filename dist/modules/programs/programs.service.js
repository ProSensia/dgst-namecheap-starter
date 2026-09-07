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
exports.ProgramsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const programInclude = {
    fundingCategories: true,
    requiredDocumentTypes: true,
    eligibilityCriteria: true,
};
let ProgramsService = class ProgramsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    listPublished() {
        return this.prisma.program.findMany({
            where: { status: 'PUBLISHED' },
            include: programInclude,
            orderBy: { applicationDeadline: 'asc' },
        });
    }
    listAll() {
        return this.prisma.program.findMany({ include: programInclude, orderBy: { createdAt: 'desc' } });
    }
    async findOne(id) {
        const program = await this.prisma.program.findUnique({ where: { id }, include: programInclude });
        if (!program)
            throw new common_1.NotFoundException('Program not found');
        return program;
    }
    async create(dto, actor, ipAddress) {
        const existing = await this.prisma.program.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException('A program with this code already exists');
        const program = await this.prisma.program.create({
            data: {
                code: dto.code,
                title: dto.title,
                description: dto.description,
                applicationOpenAt: dto.applicationOpenAt ? new Date(dto.applicationOpenAt) : null,
                applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null,
                fundingCategories: { create: dto.fundingCategories },
                requiredDocumentTypes: dto.requiredDocumentTypes ? { create: dto.requiredDocumentTypes } : undefined,
                eligibilityCriteria: dto.eligibilityCriteria ? { create: dto.eligibilityCriteria } : undefined,
            },
            include: programInclude,
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'PROGRAM_CREATED',
            entityType: 'Program',
            entityId: program.id,
            newValue: program,
            ipAddress,
        });
        return program;
    }
    async update(id, dto, actor, ipAddress) {
        const before = await this.findOne(id);
        const program = await this.prisma.program.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                applicationOpenAt: dto.applicationOpenAt ? new Date(dto.applicationOpenAt) : undefined,
                applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : undefined,
            },
            include: programInclude,
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'PROGRAM_UPDATED',
            entityType: 'Program',
            entityId: id,
            previousValue: before,
            newValue: program,
            ipAddress,
        });
        return program;
    }
    async setStatus(id, status, actor, ipAddress) {
        const before = await this.findOne(id);
        const program = await this.prisma.program.update({ where: { id }, data: { status }, include: programInclude });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'PROGRAM_STATUS_CHANGED',
            entityType: 'Program',
            entityId: id,
            previousValue: { status: before.status },
            newValue: { status: program.status },
            ipAddress,
        });
        return program;
    }
};
exports.ProgramsService = ProgramsService;
exports.ProgramsService = ProgramsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ProgramsService);
//# sourceMappingURL=programs.service.js.map