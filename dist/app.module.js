"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const serve_static_1 = require("@nestjs/serve-static");
const jwt_1 = require("@nestjs/jwt");
const path_1 = require("path");
const prisma_module_1 = require("./common/prisma/prisma.module");
const audit_module_1 = require("./common/audit/audit.module");
const storage_module_1 = require("./common/storage/storage.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const permissions_guard_1 = require("./common/guards/permissions.guard");
const csrf_guard_1 = require("./common/guards/csrf.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const applicant_categories_module_1 = require("./modules/applicant-categories/applicant-categories.module");
const programs_module_1 = require("./modules/programs/programs.module");
const applications_module_1 = require("./modules/applications/applications.module");
const projects_module_1 = require("./modules/projects/projects.module");
const attachments_module_1 = require("./modules/attachments/attachments.module");
const report_templates_module_1 = require("./modules/report-templates/report-templates.module");
const reports_module_1 = require("./modules/reports/reports.module");
const verification_module_1 = require("./modules/verification/verification.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [{ ttl: 60_000, limit: 120 }],
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'public'),
                exclude: ['/api*'],
            }),
            jwt_1.JwtModule.register({}),
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            storage_module_1.StorageModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            applicant_categories_module_1.ApplicantCategoriesModule,
            programs_module_1.ProgramsModule,
            applications_module_1.ApplicationsModule,
            projects_module_1.ProjectsModule,
            attachments_module_1.AttachmentsModule,
            report_templates_module_1.ReportTemplatesModule,
            reports_module_1.ReportsModule,
            verification_module_1.VerificationModule,
            audit_logs_module_1.AuditLogsModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: csrf_guard_1.CsrfGuard },
            { provide: core_1.APP_GUARD, useClass: permissions_guard_1.PermissionsGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map