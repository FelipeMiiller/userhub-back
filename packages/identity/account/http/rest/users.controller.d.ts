import { Roles } from '@hub/shared-module/authorization/core/enum/role.enum';
import { UsersService } from '../../core/services/users.service';
import { CreateUserRequestDto } from '../dto/request/create-user.dto';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { UpdateUserRequestDto } from '../dto/request/update-users.dto';
export declare class UsersController {
  private readonly usersService;
  constructor(usersService: UsersService);
  create(userDto: CreateUserRequestDto): Promise<UserResponseDto>;
  findAll(role?: Roles, sortBy?: string, order?: 'asc' | 'desc'): Promise<UserResponseDto[]>;
  findInactive(days?: number): Promise<UserResponseDto[]>;
  findById(id: string): Promise<UserResponseDto | null>;
  findByEmail(email: string): Promise<UserResponseDto | null>;
  update(id: string, dto: UpdateUserRequestDto): Promise<UserResponseDto>;
  delete(id: string): Promise<void>;
}
