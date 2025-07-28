import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const userGoogleStrategyPassport = 'user-google';

@Injectable()
export class GoogleUserAuthGuard extends AuthGuard(userGoogleStrategyPassport) {}
