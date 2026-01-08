import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from '../common/enums/role.enum';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_CLIENT_KEY, ROLES_KEY } from '../decorators/roles.decorator';

interface RequestUser {
  id: string;
  email: string;
  name: string;
  type: 'user' | 'client';
  role: Role | null;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler() as (...args: any[]) => any;
    const controller = context.getClass() as new (...args: any[]) => any;

    // Check if route is public - if so, allow access
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      controller,
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.getRequiredRoles(handler, controller);
    const allowClient = this.getAllowClient(handler, controller);

    if (!requiredRoles.length && !allowClient) {
      return true;
    }

    const user = this.getUserFromRequest(context);
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    if (this.isClient(user)) {
      return this.checkClientAccess(allowClient);
    }

    return this.checkUserAccess(user, requiredRoles, allowClient);
  }

  private getRequiredRoles(
    handler: (...args: any[]) => any,
    controller: new (...args: any[]) => any,
  ): Role[] {
    return (
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        handler,
        controller,
      ]) || []
    );
  }

  private getAllowClient(
    handler: (...args: any[]) => any,
    controller: new (...args: any[]) => any,
  ): boolean {
    const allowClientOnHandler = this.reflector.get<boolean>(
      ALLOW_CLIENT_KEY,
      handler,
    );
    const hasRolesOnHandler = this.reflector.get<Role[]>(ROLES_KEY, handler);

    if (hasRolesOnHandler !== undefined) {
      return allowClientOnHandler ?? false;
    }

    return (
      this.reflector.get<boolean>(ALLOW_CLIENT_KEY, controller) ?? false
    );
  }

  private getUserFromRequest(context: ExecutionContext): RequestUser | null {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    return request.user || null;
  }

  private isClient(user: RequestUser): boolean {
    return user.type === 'client';
  }

  private checkClientAccess(allowClient: boolean): boolean {
    if (!allowClient) {
      throw new ForbiddenException(
        'Clients are not allowed to access this resource',
      );
    }
    return true;
  }

  private checkUserAccess(
    user: RequestUser,
    requiredRoles: Role[],
    allowClient: boolean,
  ): boolean {
    if (allowClient && requiredRoles.length === 0) {
      return true;
    }

    if (!user.role) {
      throw new ForbiddenException('User does not have an assigned role');
    }

    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `User role '${user.role}' does not have permission to access this resource. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
