import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const refreshStrategyPassport = 'refresh-jwt';

@Injectable()
export class RefreshAuthGuard extends AuthGuard(refreshStrategyPassport) {}
