"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const report_templates_controller_1 = require("./report-templates.controller");
const report_templates_service_1 = require("./report-templates.service");
let ReportTemplatesModule = class ReportTemplatesModule {
};
exports.ReportTemplatesModule = ReportTemplatesModule;
exports.ReportTemplatesModule = ReportTemplatesModule = __decorate([
    (0, common_1.Module)({
        controllers: [report_templates_controller_1.ReportTemplatesController],
        providers: [report_templates_service_1.ReportTemplatesService],
        exports: [report_templates_service_1.ReportTemplatesService],
    })
], ReportTemplatesModule);
//# sourceMappingURL=report-templates.module.js.map