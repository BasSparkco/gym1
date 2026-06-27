import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Validates the device token sent as a query parameter.
 *
 * BAS-IP devices only support configuring a URL for the remote access server —
 * they cannot add custom request headers. The token is therefore embedded in
 * the URL: ?token=<DEVICE_TOKEN>
 *
 * Configure on device: https://<domain>/api/access/bas-ip?branchId=<id>&token=<DEVICE_TOKEN>
 */
@Injectable()
export class BasIpDeviceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const deviceToken = process.env.DEVICE_TOKEN;

    if (!deviceToken) {
      throw new UnauthorizedException('Device token is not configured.');
    }

    const provided = request.query['token'];
    if (provided !== deviceToken) {
      throw new UnauthorizedException('Invalid device token.');
    }

    return true;
  }
}
