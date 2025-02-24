import { TokenJWTService } from 'src/Services/TokenJWTService';
import { 
    BadRequestException,
    ForbiddenException,
    Injectable, 
    NotFoundException
} from "@nestjs/common";
import { ProjetoRepository } from "src/Repositories/ProjetoRepository";
import { MailService } from "./MailService";
import { UsuarioRepository } from "src/Repositories/UsuarioRepository";
import { UsuarioService } from 'src/Services/UsuarioService';
import { randomBytes } from 'crypto';
import { AssociadosAoProjetoService } from './AssociadosAoProjetoService';
import { HttpService } from './HttpService';
import { isEmpty } from 'class-validator';


@Injectable()
export class ProjetoService {
    constructor(
        private readonly nivelPermissao: AssociadosAoProjetoService, 
        private readonly mailService: MailService,
        private readonly projetoRepository: ProjetoRepository,
        private readonly usuarioRepository: UsuarioRepository,
        private readonly tokenJWTService: TokenJWTService,
        private readonly usuarioService: UsuarioService,
        private readonly httpRetorno: HttpService
    ) {}
    
    async removerAssociado(
        idProjeto: number,
        idUsuario: number,
        idAssociado: number
    ): Promise<any> {

        //  Verifica se é o correspondente
        const correspondente = await this.nivelPermissao.ehCorrespondente(
            idUsuario,
            idProjeto
        );
        if (!correspondente) {
            return this.httpRetorno.retorno(403);
        }   
        const idPermissao = await this.nivelPermissao.buscarId(
            idUsuario,
            idProjeto
        );
        if (idPermissao === idAssociado) {
            throw new ForbiddenException("Correspondente não pode ser removido.")
        }

        //  Verifica id do associado
        if (!await this.nivelPermissao.associadoExiste(
            idAssociado, 
            idProjeto
        )) {
            return this.httpRetorno.retorno(404, "Associado");
        }

        //  Remove associação
        if (await this.nivelPermissao.removerPorId(idAssociado)) {
            return this.httpRetorno.retorno(204, "Associado");
        } else {
            return this.httpRetorno.retorno(404, "Associado");
        }
    }

    async convidarAssociado(idUsuario: number, dados): Promise<any> {
        const { idProjeto, url, email, nivelPermissao, nome } = dados;
    
        if (
            isEmpty(idUsuario) ||
            isEmpty(idProjeto) || 
            isEmpty(url) || 
            isEmpty(email) || 
            isEmpty(nivelPermissao) ||
            isEmpty(nome)
        ) {
            return await this.httpRetorno.retorno(400)
        }

        const usuario = {
            idProjeto,
            nome,
            email,
            nivelPermissao
        };

        //  Verifica existência do projeto e se é correspondente
        const nomeProjeto = await this.projetoRepository.buscarNomeProjeto(
            idProjeto
        );
        if (!nomeProjeto) {
            return this.httpRetorno.retorno(404, "Projeto");
        }
        if(!await this.nivelPermissao.ehCorrespondente(
            idUsuario,
            idProjeto
        )) {
            return this.httpRetorno.retorno(403);
        }

        //  Gera token para convite
        const token = await this.tokenJWTService.criaTokenEmail(usuario);
        if (!token) {
            return this.httpRetorno.retorno(500);
        }

        //  Envia email com o convite
        this.mailService.convidarProjeto(
            nome, 
            email, 
            nomeProjeto, 
            url, 
            token
        );

        return this.httpRetorno.retorno(200);
    }

    async aceitarConvite(token: string): Promise<any> {
        const usuario = await this.tokenJWTService.verificaToken(token);
        if (!usuario) {
            throw new BadRequestException("Requisição inválida. Verifique o token enviado.")
        }
        
        const email = usuario.usuario.email
        const estaNoSistema = await this.usuarioService.buscarPorEmail(email)
        
        const idProjeto = usuario.usuario.idProjeto
        const estaNoProjeto = await this.usuarioService.estaNoProjeto(
            email, idProjeto)
            
        if (!estaNoSistema && estaNoProjeto){
            return this.httpRetorno.retorno(404, "Usuário")
        }
        if (estaNoSistema && estaNoProjeto){
            return this.httpRetorno.retorno(409, "usuário. Já está cadastrado")
        }   

        // Adiciona o convidado ao projeto e informa por email
        if (estaNoSistema){
            await this.nivelPermissao.criarAutor(
                estaNoSistema.id,
                idProjeto,
                usuario.usuario.nivelPermissao
            )
            const nomeProjeto = await this.projetoRepository.buscarNomeProjeto(
                usuario.usuario.idProjeto)
            this.mailService.usuarioFoiAssociado(
                email, 
                usuario.usuario.nome,
                usuario.usuario.nivelPermissao,
                nomeProjeto)
            return this.httpRetorno.retorno(201, "Associado")
        }

        //  Cria e verifica unicidade de login
        const nomeCompleto = usuario.usuario.nome.split(" ");
        const nome = nomeCompleto[0].trim().toLowerCase();
        const loginInicial = nome.replace(/\s+/g, "");
        let loginFinal = loginInicial;
        if (await this.usuarioRepository.buscarPorLogin(loginInicial)) {
            let aux = 1;
            loginFinal = `${loginInicial}${aux}`;
            while (await this.usuarioRepository.buscarPorLogin(loginFinal)) {
                aux++;
                loginFinal = `${loginInicial}${aux}`;
            }
        }
        
        //  Gera uma senha aleatória
        const buffer = randomBytes(4);
        const senha = buffer.toString("hex");

        const dados = {
            login: loginFinal,
            senha: senha,
            email: usuario.usuario.email,
            cpf: "00000000000",
            nome: usuario.usuario.nome,
            naturezaJuridica: true,
            qualificacao: "",
            statusDeContato: true,
            nivelPermissao: {
                nivelPermissao: usuario.usuario.nivelPermissao
            }
        }

        //  Cria usuário e seu nível de permissão
        await this.usuarioService.criarPorConvite(dados);
        const user = await this.usuarioRepository.buscarPorLogin(
            loginFinal
        );
        if (!user) {
            throw new NotFoundException("Usuário não encontrado.")
        }
        await this.nivelPermissao.criarAutor(
            user.id,
            usuario.usuario.idProjeto,
            usuario.usuario.nivelPermissao
        );
    
        //  Envia o email informando a senha provisória
        const nomeProjeto = await this.projetoRepository.buscarNomeProjeto(
            usuario.usuario.idProjeto
        );
        this.mailService.contaCriada(
            nome, 
            nomeProjeto,
            senha,
            usuario.usuario.email,
            loginFinal
        );
        return user;
    }

    async incluirAutor(idCorrespondente: number, dados): Promise<any> {

        const { idProjeto, idAutor, nivelPermissao } = dados;
        
        //  Verificações para inclusão
        if (!await this.projetoRepository.buscarPorId(idProjeto)) {
            return this.httpRetorno.retorno(404, "Projeto");
        }
        if(!await this.nivelPermissao.ehCorrespondente(
            idCorrespondente,
            idProjeto
        )) {
            return this.httpRetorno.retorno(403);
        }
        if (!await this.usuarioRepository.buscarPorId(idAutor)) {
            return this.httpRetorno.retorno(404, "Usuário Autor");
        }
        if (await this.nivelPermissao.verificarAutor(
            idAutor, 
            idProjeto
        )) {
            throw new BadRequestException("Este usuário já está associado ao projeto.");
        }

        await this.nivelPermissao.criarAutor(
            idAutor, 
            idProjeto,
            nivelPermissao
        );
        
        return this.httpRetorno.retorno(201, nivelPermissao);
    }

    async incluirNaoAutor(idCorrespondente: number, dados): Promise<{}> {

        const { idProjeto, nomeNaoAutor, nivelPermissao } = dados;

        if(!idCorrespondente || 
            isNaN(idCorrespondente) || 
            isEmpty(nomeNaoAutor) ||
            isEmpty(nivelPermissao)){

            return this.httpRetorno.retorno(400);
        }
    
        if (!await this.projetoRepository.buscarPorId(idProjeto)) {
            return this.httpRetorno.retorno(404, "Projeto");
        }
        if(!await this.nivelPermissao.ehCorrespondente(
            idCorrespondente,
            idProjeto
        )) {
            return this.httpRetorno.retorno(403);
        }

        await this.nivelPermissao.criarNaoAutor(
            idProjeto,
            nomeNaoAutor,
            nivelPermissao
        );

        return this.httpRetorno.retorno(201, nivelPermissao);
    }
}
