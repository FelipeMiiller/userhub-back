import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const userLocalStrategyPassport = 'user-local';

@Injectable()
export class LocalUserAuthGuard extends AuthGuard(userLocalStrategyPassport) {}
