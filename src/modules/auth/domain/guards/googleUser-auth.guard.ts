import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const userGoogleStrategy = 'user-google';

@Injectable()
export class GoogleUserAuthGuard extends AuthGuard(userGoogleStrategy) {}
