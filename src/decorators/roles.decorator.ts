import { SetMetadata } from '@nestjs/common';

import { Role } from '../common/enums/role.enum';

export const ROLES_KEY = 'roles';
export const ALLOW_CLIENT_KEY = 'allowClient';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const AllowClient = () => SetMetadata(ALLOW_CLIENT_KEY, true);
