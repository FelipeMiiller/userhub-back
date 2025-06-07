import { SetMetadata } from '@nestjs/common';

export const SKIP_LOGGING_KEY = 'skipLogging';
export const SkipLogging = () => SetMetadata(SKIP_LOGGING_KEY, true);
