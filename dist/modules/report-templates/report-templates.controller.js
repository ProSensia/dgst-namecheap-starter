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
exports.ReportTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const request_user_type_1 = require("../../common/types/request-user.type");
const permission_catalog_1 = require("../../common/permissions/permission-catalog");
const report_templates_service_1 = require("./report-templates.service");
const upsert_report_template_dto_1 = require("./dto/upsert-report-template.dto");
let ReportTemplatesController = class ReportTemplatesController {
    constructor(service) {
        this.service = service;
    }
    listActive(programId) {
        return this.service.listActive(programId);
    }
    listAll() {
        return this.service.listAll();
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(dto, actor, req) {
        return this.service.create(dto, actor, req.ip);
    }
    update(id, dto, actor, req) {
        return this.service.update(id, dto, actor, req.ip);
    }
};
exports.ReportTemplatesController = ReportTemplatesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('programId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportTemplatesController.prototype, "listActive", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.REPORT_TEMPLATE, 'VIEW')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportTemplatesController.prototype, "listAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportTemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.REPORT_TEMPLATE, 'CREATE')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_report_template_dto_1.UpsertReportTemplateDto, Object, Object]),
    __metadata("design:returntype", void 0)
], ReportTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.REPORT_TEMPLATE, 'EDIT')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ReportTemplatesController.prototype, "update", null);
exports.ReportTemplatesController = ReportTemplatesController = __decorate([
    (0, common_1.Controller)('report-templates'),
    __metadata("design:paramtypes", [report_templates_service_1.ReportTemplatesService])
], ReportTemplatesController);
//# sourceMappingURL=report-templates.controller.js.map