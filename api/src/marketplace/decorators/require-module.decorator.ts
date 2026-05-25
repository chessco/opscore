import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MODULE_KEY = 'require-module';
export const RequireModule = (moduleId: string) => SetMetadata(REQUIRE_MODULE_KEY, moduleId);
