import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
            passReqToCallback: true,
        });
    }

    async validate(req: any, payload: any) {
        let activeTenantId = payload.tenantId;
        const targetTenant = req.headers['x-tenant-id'];

        if (payload.role === 'SYSTEM' && targetTenant) {
            activeTenantId = targetTenant;
        }

        return { userId: payload.sub, email: payload.email, role: payload.role, tenantId: activeTenantId };
    }
}
