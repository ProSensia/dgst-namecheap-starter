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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const request_user_type_1 = require("../../common/types/request-user.type");
const permission_catalog_1 = require("../../common/permissions/permission-catalog");
const roles_service_1 = require("./roles.service");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const set_role_permissions_dto_1 = require("./dto/set-role-permissions.dto");
let RolesController = class RolesController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    listPermissions() {
        return this.rolesService.listPermissionCatalog();
    }
    list() {
        return this.rolesService.list();
    }
    findOne(id) {
        return this.rolesService.findOne(id);
    }
    create(dto, actor, req) {
        return this.rolesService.create(dto, actor, req.ip);
    }
    update(id, dto, actor, req) {
        return this.rolesService.update(id, dto, actor, req.ip);
    }
    setPermissions(id, dto, actor, req) {
        return this.rolesService.setPermissions(id, dto, actor, req.ip);
    }
    remove(id, actor, req) {
        return this.rolesService.remove(id, actor, req.ip);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)('permissions'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.ROLE, 'VIEW')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "listPermissions", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.ROLE, 'VIEW')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('roles/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.ROLE, 'VIEW')),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.ROLE, 'CREATE')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto, Object, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('roles/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.ROLE, 'EDIT')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateRoleDto, Object, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "update", null);
__decorate([
    (0, common_1.Put)('roles/:id/permissions'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.ROLE, 'EDIT')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_role_permissions_dto_1.SetRolePermissionsDto, Object, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "setPermissions", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)((0, request_user_type_1.permissionKey)(permission_catalog_1.RESOURCES.ROLE, 'DELETE')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "remove", null);
exports.RolesController = RolesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map