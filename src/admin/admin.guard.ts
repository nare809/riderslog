import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        // 1. Get the key from the request header
        const apiKey = request.headers['x-api-key'];

        // 2. Check if it matches your secret environment variable
        if (apiKey !== process.env.ADMIN_API_KEY) {
            throw new UnauthorizedException('❌ Access Denied: Invalid API Key');
        }

        return true; // ✅ Allow access
    }
}