import { 
    CanActivate, 
    ExecutionContext, 
    ForbiddenException, 
    Injectable, 
    mixin 
} from "@nestjs/common";
import { AssociadosAoProjetoRepository } from "src/Repositories/AssociadosAoProjetoRepository";


export const PermissaoGuard = (permissoes: string[]) => {
    @Injectable()
    class PermissaoGuardMixin implements CanActivate {
        constructor(
            readonly associadosRepository: AssociadosAoProjetoRepository
        ) {}

        async canActivate(context: ExecutionContext): Promise<any> {

            try {
                const req = context.switchToHttp().getRequest();
                const idUsuario = Number(req.usuario.usuario.id);
                const role = req.usuario.usuario.role;
                let idProjeto = Number(req.query.idProjeto);
                
                for (const permissao of permissoes) {
                    if (
                        permissao === "Administrador" &&
                        role === "Administrador"
                    ) {
                        return true;
                    }
                }

                if (isNaN(idProjeto) || idProjeto === undefined) {
                    if (req.params?.id) {
                        idProjeto = req.params.id;
                    } else if (req.body?.idProjeto) {
                        idProjeto = req.body.idProjeto;
                    } else if (req.dados?.idProjeto) {
                        idProjeto = req.dados.idProjeto;
                    } else if (req.body?.body?.idProjeto) {
                        idProjeto = req.body.body.idProjeto;
                    } else if (req.body?.dados?.idProjeto) {
                        idProjeto = req.body.dados.idProjeto;  
                    } 
                }
                
                if (idProjeto) {
                    const permissaoAtual = 
                        await this.associadosRepository.buscarNivelPermissao(
                            idUsuario, 
                            idProjeto
                        );

                    if (permissaoAtual === -1) {
                        throw new ForbiddenException("*Acesso proibido. O usuário não possui permissão para esta ação.");
                    }  

                    for (const permissao of permissoes) {
                        if (permissaoAtual === permissao) {
                            return true;
                        }
                    }
                    
                    throw new ForbiddenException("*Acesso proibido. O usuário não possui permissão para esta ação.");
                } else {
                    return true;
                }
            } catch (error) {
                
                // console.log(error)
                return new ForbiddenException("*Acesso proibido. O usuário não possui permissão para esta ação.");
            }
        }
    }
    const guard = mixin(PermissaoGuardMixin);
    return guard;
}
