import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const userLocalStrategy = 'user-local';

@Injectable()
export class LocalUserAuthGuard extends AuthGuard(userLocalStrategy) {}
