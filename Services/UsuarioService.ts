
import { Injectable } from "@nestjs/common";
import { genSalt, hash, } from "bcrypt";
import { UsuarioRepository } from "src/Repositories/UsuarioRepository";
import { HttpService } from "./HttpService";


@Injectable()
export class UsuarioService {
    constructor(
        private readonly usuarioRepository: UsuarioRepository,
        private readonly httpService: HttpService
    ) {}

    async criarPorConvite(
        dadosUsuario: {
            login: string,
            senha: string,
            email: string,
            cpf: string,
            nome: string,
            naturezaJuridica: boolean,
            qualificacao: string,
            statusDeContato: boolean
        }
    ): Promise<any> {
        const {
            senha
        } = dadosUsuario;
        const saltRounds = 8;
        const salt = await genSalt(saltRounds);
        const senhaHash = await hash(senha, salt);
        const usuario = await this.usuarioRepository.criarPorConvite(
            dadosUsuario,
            senhaHash
        );
        if (!usuario) {
            return this.httpService.retorno(400);
        }
    }

    async buscarUsuario(login: string): Promise<any> {
        const usuario = await this.usuarioRepository.buscarPorLogin(login);
        if (usuario) {
            return usuario;
        } else {
            return this.httpService.retorno(404, "Usuário");
        }
    }

    async buscarPermissoes(idUsuario: number): Promise<any> {
        return await this.usuarioRepository.buscarPermissoes(idUsuario);
    }

    async estaNoProjeto(email: string, idProjeto: string): Promise<{}> {
        return await this.usuarioRepository.estaNoProjeto(
            email, idProjeto)
    }
}
