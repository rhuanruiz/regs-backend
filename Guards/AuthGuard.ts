import { TokenJWTService } from "src/Services/TokenJWTService";
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly tokenJWTService: TokenJWTService) {}

    async canActivate(contexto: ExecutionContext): Promise<boolean> {
        const req = contexto.switchToHttp().getRequest();
        const token = this.tokenJWTService.extraiToken(req);
        if (!token) {
            throw new UnauthorizedException("Acesso não autorizado. Token inválido.");
        }
        const tokenVerificado = await this.tokenJWTService.verificaToken(token);
        if (tokenVerificado) {
            req["usuario"] = tokenVerificado;
        } else {
            throw new UnauthorizedException("Acesso não autorizado. Token inválido.");  
        }
        return true;
    }
}
