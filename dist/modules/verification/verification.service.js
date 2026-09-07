"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const QRCode = __importStar(require("qrcode"));
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const DIRECTORATE_NAME = 'Directorate of Science & Technology, Khyber Pakhtunkhwa';
let VerificationService = class VerificationService {
    constructor(prisma, audit, config) {
        this.prisma = prisma;
        this.audit = audit;
        this.config = config;
    }
    async issue(entityType, entityId, actor, ipAddress) {
        const record = await this.prisma.verificationRecord.create({
            data: { entityType, entityId, issuedByUserId: actor.id },
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'VERIFICATION_RECORD_ISSUED',
            entityType: 'VerificationRecord',
            entityId: record.id,
            newValue: { entityType, entityId },
            ipAddress,
        });
        return { ...record, verifyUrl: this.buildVerifyUrl(record.id) };
    }
    async revoke(id, reason, actor, ipAddress) {
        const record = await this.prisma.verificationRecord.update({
            where: { id },
            data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: reason },
        });
        await this.audit.log({
            actorUserId: actor.id,
            action: 'VERIFICATION_RECORD_REVOKED',
            entityType: 'VerificationRecord',
            entityId: id,
            newValue: { reason },
            ipAddress,
        });
        return record;
    }
    buildVerifyUrl(id) {
        const base = this.config.get('PUBLIC_VERIFY_BASE_URL', 'http://localhost:5173/verify');
        return `${base}/${id}`;
    }
    async qrPngBuffer(id) {
        return QRCode.toBuffer(this.buildVerifyUrl(id), { errorCorrectionLevel: 'M', width: 320, margin: 2 });
    }
    async publicVerify(id, ipAddress, userAgent) {
        const record = await this.prisma.verificationRecord.findUnique({ where: { id } });
        if (!record || record.status !== 'ACTIVE') {
            await this.logScan(id, ipAddress, userAgent, 'NOT_VERIFIED');
            return { verified: false };
        }
        const result = await this.buildPublicResult(record.entityType, record.entityId);
        await this.logScan(id, ipAddress, userAgent, result ? 'VERIFIED' : 'NOT_VERIFIED');
        return result ?? { verified: false };
    }
    async logScan(verificationRecordId, ipAddress, userAgent, resultStatus) {
        const exists = await this.prisma.verificationRecord.findUnique({ where: { id: verificationRecordId }, select: { id: true } });
        if (!exists)
            return;
        await this.prisma.verificationScanLog.create({
            data: { verificationRecordId, ipAddress, userAgent, resultStatus },
        });
    }
    async buildPublicResult(entityType, entityId) {
        switch (entityType) {
            case 'AWARD_LETTER': {
                const letter = await this.prisma.awardLetter.findUnique({
                    where: { id: entityId },
                    include: { project: { include: { program: true } } },
                });
                if (!letter)
                    return null;
                return {
                    verified: true,
                    directorate: DIRECTORATE_NAME,
                    projectId: letter.project.projectCode,
                    projectTitle: letter.project.title,
                    awardStatus: 'Approved',
                    projectStatus: this.humanizeStatus(letter.project.status),
                    issueDate: letter.issueDate,
                    referenceType: 'Award Letter',
                    referenceNumber: letter.project.projectCode,
                };
            }
            case 'CERTIFICATE': {
                const cert = await this.prisma.certificate.findUnique({
                    where: { id: entityId },
                    include: { project: true },
                });
                if (!cert)
                    return null;
                return {
                    verified: true,
                    directorate: DIRECTORATE_NAME,
                    projectId: cert.project.projectCode,
                    projectTitle: cert.project.title,
                    awardStatus: 'Approved',
                    projectStatus: this.humanizeStatus(cert.project.status),
                    issueDate: cert.issueDate,
                    referenceType: 'Completion Certificate',
                    referenceNumber: cert.certificateNumber,
                };
            }
            case 'REPORT': {
                const report = await this.prisma.report.findUnique({
                    where: { id: entityId },
                    include: { project: true, template: true },
                });
                if (!report)
                    return null;
                return {
                    verified: true,
                    directorate: DIRECTORATE_NAME,
                    projectId: report.project.projectCode,
                    projectTitle: report.project.title,
                    awardStatus: 'Approved',
                    projectStatus: this.humanizeStatus(report.project.status),
                    issueDate: report.decidedAt,
                    referenceType: report.template.name,
                    referenceNumber: `${report.template.code}-${report.periodLabel ?? ''}`,
                };
            }
            case 'PROJECT': {
                const project = await this.prisma.project.findUnique({ where: { id: entityId } });
                if (!project)
                    return null;
                return {
                    verified: true,
                    directorate: DIRECTORATE_NAME,
                    projectId: project.projectCode,
                    projectTitle: project.title,
                    awardStatus: 'Approved',
                    projectStatus: this.humanizeStatus(project.status),
                    issueDate: project.createdAt,
                    referenceType: 'Project',
                    referenceNumber: project.projectCode,
                };
            }
            default:
                return null;
        }
    }
    humanizeStatus(status) {
        return status
            .toLowerCase()
            .split('_')
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(' ');
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        config_1.ConfigService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map