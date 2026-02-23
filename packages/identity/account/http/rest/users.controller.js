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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const cache_manager_1 = require("@nestjs/cache-manager");
const jwt_auth_guard_1 = require("../../../../../shared/modules/authorization/core/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../../../../shared/modules/authorization/core/decorator/roles.decorator");
const role_enum_1 = require("../../../../../shared/modules/authorization/core/enum/role.enum");
const permission_decorator_1 = require("../../../core/decorators/permission.decorator");
const permission_guard_1 = require("../../../core/guards/permission.guard");
const users_service_1 = require("../../core/services/users.service");
const create_user_dto_1 = require("../dto/request/create-user.dto");
const user_response_dto_1 = require("../dto/response/user-response.dto");
const update_users_dto_1 = require("../dto/request/update-users.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(userDto) {
        const user = await this.usersService.create(userDto);
        return (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
            excludeExtraneousValues: true,
        });
    }
    async findAll(role, sortBy = 'Name', order = 'asc') {
        const users = await this.usersService.findMany({ role, sortBy, order });
        return users.map((u) => (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, u, {
            excludeExtraneousValues: true,
        }));
    }
    async findInactive(days = 30) {
        const users = await this.usersService.findInactive(days);
        return users.map((u) => (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, u, {
            excludeExtraneousValues: true,
        }));
    }
    async findById(id) {
        const user = await this.usersService.findOneById(id);
        if (!user) {
            throw new common_1.NotFoundException(`Usuário com ID '${id}' não encontrado`);
        }
        return (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
            excludeExtraneousValues: true,
        });
    }
    async findByEmail(email) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user)
            return null;
        return (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
            excludeExtraneousValues: true,
        });
    }
    async update(id, dto) {
        const user = await this.usersService.update(id, dto);
        return (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
            excludeExtraneousValues: true,
        });
    }
    async delete(id) {
        await this.usersService.delete(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, roles_decorator_1.RolesGuards)([role_enum_1.Roles.ADMIN]),
    (0, permission_decorator_1.Permission)('tenant.user.create'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cria um novo usuário' }),
    (0, swagger_1.ApiBody)({ type: create_user_dto_1.CreateUserRequestDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Usuário criado com sucesso', type: user_response_dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Usuário já existe' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserRequestDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(300),
    (0, roles_decorator_1.RolesGuards)([role_enum_1.Roles.ADMIN]),
    (0, permission_decorator_1.Permission)('tenant.user.list'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lista todos os usuários (paginado, filtro por role e ordenação)' }),
    (0, swagger_1.ApiQuery)({
        name: 'role',
        required: false,
        enum: role_enum_1.Roles,
        description: 'Filtrar por role (admin ou user)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sortBy',
        required: false,
        type: String,
        description: 'Campo para ordenar (ex: Name, Email, CreatedAt)',
    }),
    (0, swagger_1.ApiQuery)({ name: 'order', required: false, type: String, description: 'asc ou desc' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de usuários', type: [user_response_dto_1.UserResponseDto] }),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('sortBy')),
    __param(2, (0, common_1.Query)('order')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(5),
    (0, roles_decorator_1.RolesGuards)([role_enum_1.Roles.ADMIN]),
    (0, permission_decorator_1.Permission)('tenant.user.list'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.Get)('inactive'),
    (0, swagger_1.ApiOperation)({ summary: 'Lista usuários inativos (sem login recente)' }),
    (0, swagger_1.ApiQuery)({
        name: 'days',
        required: false,
        type: Number,
        description: 'Dias sem login (default: 30)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de usuários inativos', type: [user_response_dto_1.UserResponseDto] }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findInactive", null);
__decorate([
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(5),
    (0, roles_decorator_1.RolesGuards)([role_enum_1.Roles.ADMIN]),
    (0, permission_decorator_1.Permission)('tenant.user.view'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca usuário por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usuário encontrado', type: user_response_dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Usuário não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(5),
    (0, roles_decorator_1.RolesGuards)([role_enum_1.Roles.ADMIN]),
    (0, permission_decorator_1.Permission)('tenant.user.view'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.Get)('email/:email'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca usuário por email' }),
    (0, swagger_1.ApiParam)({ name: 'email', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usuário encontrado', type: user_response_dto_1.UserResponseDto }),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findByEmail", null);
__decorate([
    (0, roles_decorator_1.RolesGuards)([role_enum_1.Roles.ADMIN]),
    (0, permission_decorator_1.Permission)('tenant.user.update'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualiza usuário por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiBody)({ type: update_users_dto_1.UpdateUserRequestDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usuário atualizado', type: user_response_dto_1.UserResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_users_dto_1.UpdateUserRequestDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.RolesGuards)([role_enum_1.Roles.ADMIN]),
    (0, permission_decorator_1.Permission)('tenant.user.delete'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    (0, swagger_1.ApiOperation)({ summary: 'Remove usuário por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Usuário removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Usuário não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map