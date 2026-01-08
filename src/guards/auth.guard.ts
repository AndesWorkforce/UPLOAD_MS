import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';

import { getMessagePattern } from 'config';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token not provided');
    }

    try {
      // Call validation endpoint in auth-ms
      const validationResult = await this.authClient
        .send(getMessagePattern('auth.validate'), token)
        .toPromise();

      if (!validationResult || !validationResult.isValid) {
        throw new UnauthorizedException(
          validationResult?.error || 'Invalid token',
        );
      }

      request['user'] = {
        id: validationResult.userId,
        email: validationResult.email,
        name: validationResult.name,
        isActive: validationResult.isActive,
        createdAt: validationResult.createdAt,
        updatedAt: validationResult.updatedAt,
        type: validationResult.userType ?? 'user',
        role: validationResult.role ?? null,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error validating token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
