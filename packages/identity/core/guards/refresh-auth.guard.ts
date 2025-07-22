import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const refreshStrategy = 'refresh-jwt';

@Injectable()
export class RefreshAuthGuard extends AuthGuard(refreshStrategy) {}
