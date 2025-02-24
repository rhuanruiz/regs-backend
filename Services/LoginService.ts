import { TokenJWTService } from "src/Services/TokenJWTService";
import { 
    Injectable, 
    UnauthorizedException 
} from "@nestjs/common";
import { UsuarioService } from "./UsuarioService";
import { compare } from "bcrypt";


@Injectable()
export class LoginService {
    constructor(
        private readonly usuarioService: UsuarioService,
        private readonly tokenJWTService: TokenJWTService
    ) {}

    async logar(login: string, senha: string): Promise<any> {
        const usuario = await this.usuarioService.buscarUsuario(login);
        const permissoes = await this.usuarioService.buscarPermissoes(
            usuario.id
        );
        
        let role = "Usuário";
        if (usuario.administrador === true) {
            role = "Administrador";
        }
        usuario.role = role;

        if (!usuario || login != usuario.login) {
            throw new UnauthorizedException('Atenção! Os dados inseridos não são válidos. Verifique o campo login e tente novamente.');
        } else if (!(await compare(senha, usuario.senha))) {
            throw new UnauthorizedException('Atenção! Os dados inseridos não são válidos. Verifique o campo senha e tente novamente.');
        } else {
            return {
                token: await this.tokenJWTService.criaToken(usuario),
                idUsuario: usuario.id,
                role: usuario.role,
                permissoes: permissoes
            };
        }
    }
}
