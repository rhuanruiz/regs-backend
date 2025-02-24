import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CadeiaAssinaturaRepository } from "src/Repositories/CadeiaAssinaturaRepository";
import { DocAssinaturaRepository } from "src/Repositories/DocAssinaturaRepository";
import { OrdemAssinaturaRepository } from "src/Repositories/OrdemAssinaturaRepository";
import { MailService } from "./MailService";
import { AssociadosAoProjetoRepository } from "src/Repositories/AssociadosAoProjetoRepository";
import { DocAssinaturaService } from "src/Services/DocAssinaturaService";
import { MinioRepository } from "src/Repositories/MinioRepository";
import { ProjetoRepository } from "src/Repositories/ProjetoRepository";
import { TemplatePDF } from "src/templates/TemplatesPDF";
import { ParticipacaoService } from "./ParticipacaoService";
import { AssociadosAoProjetoService } from "./AssociadosAoProjetoService";
import { LogAtualizacoesService } from "./LogAtualizacoesService";
import { HttpService } from "./HttpService";
import { UsuarioRepository } from 'src/Repositories/UsuarioRepository';
import { ProjetoService } from "./ProjetoService";
import { UsuarioService } from "./UsuarioService";

const NOME_ARQUIVO = "DocumentoAssinatura.pdf";


@Injectable()
export class CadeiaAssinaturaService {
    constructor(
        private readonly cadeiaAssRepository: CadeiaAssinaturaRepository,
        private readonly docAssRepository: DocAssinaturaRepository,
        private readonly ordemAssRepository: OrdemAssinaturaRepository,
        private readonly mailService: MailService,
        private readonly associadoRepository: AssociadosAoProjetoRepository,
        private readonly associadosService: AssociadosAoProjetoService,
        private readonly docAssService: DocAssinaturaService,
        private readonly minioRepository: MinioRepository,
        private readonly logService: LogAtualizacoesService,
        private readonly projetoRepository: ProjetoRepository,
        private readonly pdfAssinatura: TemplatePDF,
        private readonly participacao: ParticipacaoService,
        private readonly httpService: HttpService,
        private readonly usuarioRepository: UsuarioRepository,
        private readonly projetoService: ProjetoService,
        private readonly usuarioService: UsuarioService,
    ) {}  

    async gerarCadeia(
        idProjeto: number,
        idUsuario: number
    ): Promise<any> {
        
        //  Checagem de permissão
        const [correspondente, nomeSoftware, dadosLista, balde] = 
            await Promise.all([
                this.associadosService.ehCorrespondente(idUsuario, idProjeto),
                this.projetoRepository.buscarNomeProjeto(idProjeto),
                this.participacao.gerarLista(idProjeto, 0),
                this.minioRepository.existeBalde(idProjeto)
            ]);
        
        if (!correspondente) {
            return this.httpService.retorno(403);
        }

        if (!await this.docAssRepository.buscarPorId(idProjeto)) {
            try{
                if(balde){
                    const buscarDocumentacao =
                    await this.docAssRepository.checarAtivo(idProjeto)

                    if(!buscarDocumentacao){

                        const docAssinatura = 
                            await this.pdfAssinatura.pdfAssinaturas(
                                nomeSoftware, 
                                dadosLista
                            );

                        const idVersio = 
                        await this.minioRepository.enviarArquivoBuffer(
                            docAssinatura, 
                            idProjeto, 
                            NOME_ARQUIVO
                        );

                        await this.docAssRepository.cadastrarPrimeiroDocumentoAssinatura(
                            "null",
                            idProjeto,
                            idVersio
                        );
                    }else{

                        const docAssinatura = await this.pdfAssinatura.pdfAssinaturas(
                            nomeSoftware, 
                            dadosLista
                        );

                        const idVersio = 
                        await this.minioRepository.enviarArquivoBuffer(
                            docAssinatura,
                            idProjeto,
                            NOME_ARQUIVO
                        );

                        await this.docAssRepository.cadastrarNovoDocumentoAssinatura(
                            "null",
                            idProjeto,
                            idVersio
                        );
                    }
            
                }else{
                    await this.minioRepository.criarBaldeComVersionamento(
                        idProjeto
                    );

                    const docAssinatura = await this.pdfAssinatura.pdfAssinaturas(
                        nomeSoftware, 
                        dadosLista
                    );

                    const idVersio = await this.minioRepository.enviarArquivoBuffer(
                        docAssinatura,
                        idProjeto,
                        NOME_ARQUIVO
                    );
                    
                    await this.docAssRepository.cadastrarPrimeiroDocumentoAssinatura(
                        "null",
                        idProjeto,
                        idVersio
                    );

                }
            }catch(error){
                return "Oops! Parece que ocorreu um erro. Por favor, tente novamente mais tarde:" +
                error 
            }
        }
        
        //  Cadeia só é iniciada se o documento já existir no banco
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (await this.cadeiaAssRepository.buscarIdCadeia(Number(idDoc))) {
            throw new ForbiddenException("Projeto já possui uma cadeia de assinatura");
        }
        const cadeia = await this.cadeiaAssRepository.criarCadeia(
            Number(idDoc)
        );
        if (!cadeia) {
            return this.httpService.retorno(500);
        }
    }

    async incluirAssociado(
        idProjeto: number, 
        idUsuario: number,
        idAssociados: number[]
    ): Promise<any> {

        // Verifica a existencia do projeto
        const existeProjeto = await this.projetoService.existeProjeto(idProjeto)
        if (!existeProjeto){
            return this.httpService.retorno(404, "Projeto")
        }

        // Verifica se todas as pessoas do projeto possuem participação
        const participacao = await this.usuarioService.listarIdUsuariosParticipacao(idProjeto)
        const projeto = await this.usuarioService.listarIdUsuariosProjeto(idProjeto)
        if (participacao.length != projeto.length){
            return this.httpService.retorno(400, "Todos os associados precisam possui participação")
        }
        for (let i = 0; i < participacao.length; i++) {
            if (participacao[i] !== projeto[i]) {
                return this.httpService.retorno(400, "Todos os associados precisam possui participação")
            }
        }
        
        //  Checagem existência da cadeia
        if (!await this.docAssRepository.buscarPorId(idProjeto)) {
            await this.gerarCadeia(idProjeto, idUsuario);
        }
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);

        if (!await this.cadeiaAssRepository.buscarIdCadeia(Number(idDoc))) {
            await this.gerarCadeia(idProjeto, idUsuario);
        }
        const idDoc2 = await this.docAssRepository.buscarPorId(idProjeto);
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc2)
        );

        //  Checagem de permissão
        const correspondente = await this.associadosService.ehCorrespondente(
            idUsuario,
            idProjeto
        );
        if (!correspondente) {
            return this.httpService.retorno(403);
        }

        //  Chacagem andamento da cadeia
        if (await this.cadeiaAssRepository.buscarEncerrada(idCadeia)) {
            throw new ForbiddenException("Cadeia de assinatura já encerrada.");
        }

        if (await this.cadeiaAssRepository.buscarStatusCadeia(idCadeia)) {
            throw new ForbiddenException("Cadeia de assinatura em andamento.");
        }

        //  Inclui os associados
        for (const idUser of idAssociados) {
            const idAssociado = await this.associadoRepository.buscarId(idUser, idProjeto);
            if (!await this.associadosService.associadoExiste(
                idAssociado, 
                idProjeto
            )) {
                return this.httpService.retorno(404, "Associado");
            }
            if (await this.ordemAssRepository.buscarIdOrdem(idCadeia, idAssociado)) {
                throw new ForbiddenException("Este associado já foi incluuído.");
            }
    
            const idOrdem = await this.ordemAssRepository.buscarUltimoId(
                Number(idCadeia)
            );
            if (idOrdem) {
                const associado = await this.ordemAssRepository.incluirAssociado(
                    Number(idCadeia),
                    idAssociado
                );
                if (!associado) {
                    return this.httpService.retorno(500);
                }
            } else {
                const associado = 
                    await this.ordemAssRepository.incluirPrimeiroAssociado(
                        Number(idCadeia),
                        idAssociado
                    );
                if (!associado) {
                    return this.httpService.retorno(500);
                }
            }
        }
        await this.iniciarCadeia(idProjeto, idUsuario);
        return this.httpService.retorno(200);
    }

    async iniciarCadeia(
        idProjeto: number,
        idUsuario: number
    ): Promise<any> {

        //  Checagem de permissão
        const correspondente = await this.associadosService.ehCorrespondente(
            idUsuario,
            idProjeto
        );
        if (!correspondente) {
            return this.httpService.retorno(403);
        }

        // Verificações para iniciar a cadeia
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (!idDoc) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc)
        );
        if (!idCadeia) {
            throw new ForbiddenException("Cadeia de assinatura não foi gerada.");
        }

        // Altera o status da cadeia para true
        if (!await this.cadeiaAssRepository.buscarStatusCadeia(idCadeia)) {
            await this.cadeiaAssRepository.alterarStatusTrue(idCadeia);
        } else {
            throw new ForbiddenException("Cadeia de assinatura já está em andamento.");
        }
    
        //  Busca os dois primeiros associados da ordem de assinatura
        const ordem = await this.ordemAssRepository.buscarAssinante(idCadeia);
        if (!ordem) {
            return this.httpService.retorno(404, "Ordem de assinante");
        }
        if (ordem.proximo === null) {
            await this.notificarAtual(ordem.idAssociadoAoProjeto);
        } else {
            await this.notificarAtualProx(
                ordem.idAssociadoAoProjeto, 
                ordem.proximo.idAssociadoAoProjeto
            );
        }
    }

    async receberDocumento(
        idProjeto: number, 
        idUsuario: number
    ): Promise<any> {

        //  Verifica existência da cadeia e se a mesma está em andamento
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (!idDoc) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc)
        );
        if (!idCadeia) {
            throw new ForbiddenException("Cadeia de assinatura não foi gerada.");
        }

        //  Verifica se o usuário faz parte do projeto
        if (await this.associadoRepository.buscarNivelPermissao(idUsuario, idProjeto) === "Correspondente" ||
            await this.cadeiaAssRepository.buscarEncerrada(idCadeia) === true) {
            return await this.docAssService.visualizarDocAssinatura(
                idProjeto,
                idUsuario
            );
        }

        const idAssociado = await this.associadoRepository.buscarId(idUsuario, idProjeto);
        if (idAssociado === -1) {
            return this.httpService.retorno(403);
        }

        //  Verifica se o associado correto receberá o documento 
        const ordem = await this.ordemAssRepository.buscarAssinante(idCadeia);
        if (ordem === undefined) {
            return this.httpService.retorno(500);
        }
        if (
            ordem.proximo !== null &&
            idAssociado === ordem.proximo.idAssociadoAoProjeto
        ) {
            throw new ForbiddenException("Este associado é o próximo a assinar.")
        }
        if (idAssociado !== ordem.idAssociadoAoProjeto) {
            return this.httpService.retorno(403);
        }
        
        return await this.docAssService.visualizarDocAssinatura(
            idProjeto,
            idUsuario
        );
    }

    async enviarDocumento(
        idProjeto: number, 
        idUsuario: number, 
        docAssPDF
    ): Promise<any> {
        
        //  Verifica existência da cadeia e se a mesma está em andamento
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (!idDoc) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc)
        );
        if (!idCadeia) {
            throw new ForbiddenException("Cadeia de assinatura não foi gerada.");
        }

        if (!await this.cadeiaAssRepository.buscarStatusCadeia(idCadeia)) {
            throw new ForbiddenException("Cadeia de assinatura NÃO está em andamento.");
        }
        
        //  Verifica se o associado correto está enviando o documento 
        const idAssociado = await this.associadoRepository.buscarId(idUsuario, idProjeto);
        if (idAssociado === -1) {
            return this.httpService.retorno(403);
        }
        const ordem = await this.ordemAssRepository.buscarAssinante(idCadeia);
        if (ordem === undefined) {
            return this.httpService.retorno(500);
        }
        if (
            ordem.proximo !== null && 
            idAssociado === ordem.proximo.idAssociadoAoProjeto
        ) {
            throw new ForbiddenException("Este associado é o próximo a assinar.")
        }
        if (idAssociado !== ordem.idAssociadoAoProjeto) {
            return this.httpService.retorno(403);
        } 
        
        //  Verfica se documento já foi enviado
        const idOrdem = await this.ordemAssRepository.buscarIdOrdem(
            Number(idCadeia),
            idAssociado
        );
        if (await this.ordemAssRepository.buscarStatusAss(idOrdem)) {
            throw new ForbiddenException("Documento de Assinatura já foi enviado.") // Aguardar confirmação/rejeiçã do correspondente
        }

        //  Verifica existência do balde e envia o documento
        const balde = await this.minioRepository.existeBalde(idProjeto)
        if (!balde) {
            await this.minioRepository.criarBaldeComVersionamento(idProjeto);
        }
        const novoDocAss = await this.minioRepository.enviarArquivoBase(
            docAssPDF,
            idProjeto,
            NOME_ARQUIVO
        );

        //  Busca id do usuário para versionamento e registro de log
        const docAss = await this.docAssRepository.buscarPorId(idProjeto);
        const usuario = await this.associadoRepository.buscarIdUsuario(
            idAssociado
        );
        await this.docAssRepository.cadastrarNovoDocumentoAssinatura(
            null,
            idProjeto,
            novoDocAss
        );
        await this.logService.novoLogAtualizacao(
            usuario.usuario[0].id,
            idProjeto,
            NOME_ARQUIVO,
            docAss+1
        );
        
        //  Atualizar link da cadeia com o documento de assinatura
        const novoDoc = await this.docAssRepository.buscarPorId(idProjeto);
        await this.cadeiaAssRepository.atualizarIdDocumento(idCadeia,novoDoc);
        
        //  Atualizar data de assinatura
        await this.ordemAssRepository.atualizarDataAssinatura(idOrdem);

        //  Altera o status da assinatura para assinado
        const statusAssinatura = 
                await this.ordemAssRepository.alterarAssinou(idOrdem);
        if (!statusAssinatura) {
            return this.httpService.retorno(404, "Ordem do Associado");
        }

        const statusAprovacao = 
            await this.ordemAssRepository.alterarStatusAprovacao(idOrdem);
        if (!statusAprovacao) {
            return this.httpService.retorno(404, "Ordem do Associado");
        }

        //  Notificar próximos assinantes
        const novaOrdem = await this.ordemAssRepository.buscarAssinante(
            idCadeia
        );
        if (ordem.proximo === null) {
            await this.cadeiaAssRepository.alterarStatusFalse(idCadeia);
            await this.cadeiaAssRepository.alterarEncerrada(idCadeia);
        } else if (novaOrdem.proximo === null) {
            await this.notificarAtual(novaOrdem.idAssociadoAoProjeto);
        } else {
            await this.notificarAtualProx(
                novaOrdem.idAssociadoAoProjeto, 
                novaOrdem.proximo.idAssociadoAoProjeto
            );
        }
    
        return this.httpService.retorno(201, "Documento de Assinatura")
    }

    async aprovarDocumento(
        idProjeto: number, 
        idUsuario: number
    ): Promise<any> {

        //  Verifica se o associado tem permissão
        const correspondente = await this.associadosService.ehCorrespondente(
            idUsuario,
            idProjeto
        );
        if (!correspondente) {
            return this.httpService.retorno(403);
        }

        //  Verificações de existência da cadeia
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (!idDoc) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc)
        );
        if (!idCadeia) {
            throw new ForbiddenException("Cadeia de assinatura não foi gerada.");
        }
        if (!await this.cadeiaAssRepository.buscarStatusCadeia(idCadeia)) {
            throw new ForbiddenException("Cadeia de assinatura NÃO está em andamento.");
        }
        
        //  Altera o status de aprovacao
        const ordem = await this.ordemAssRepository.buscarAssinante(idCadeia);
        if (ordem) {
            const idOrdem = await this.ordemAssRepository.buscarIdOrdem(
                Number(idCadeia),
                ordem.idAssociadoAoProjeto
            );
            if (!await this.ordemAssRepository.buscarStatusAss(idOrdem)) {
                throw new ForbiddenException("Associado ainda não assinou.");
            }
            const statusAprovacao = 
                await this.ordemAssRepository.alterarStatusAprovacao(idOrdem);
            if (!statusAprovacao) {
                return this.httpService.retorno(404, "Ordem do Associado");
            }

            //  Notificar próximos assinantes
            const novaOrdem = await this.ordemAssRepository.buscarAssinante(
                idCadeia
            );
            if (ordem.proximo === null) {
                await this.cadeiaAssRepository.alterarStatusFalse(idCadeia);
                await this.cadeiaAssRepository.alterarEncerrada(idCadeia);
            } else if (novaOrdem.proximo === null) {
                await this.notificarAtual(novaOrdem.idAssociadoAoProjeto);
            } else {
                await this.notificarAtualProx(
                    novaOrdem.idAssociadoAoProjeto, 
                    novaOrdem.proximo.idAssociadoAoProjeto
                );
            }
        } else {
            throw new ForbiddenException("Cadeia de assinatura já encerrada.");
        }
        return this.httpService.retorno(200);
    }

    async rejeitarDocumento(
        idProjeto: number, 
        idUsuario: number
    ): Promise<any> {

        //  Verificação permissão
        const correspondente = await this.associadosService.ehCorrespondente(
            idUsuario,
            idProjeto
        );
        if (!correspondente) {
            return this.httpService.retorno(403);
        }

        //  Verificações para procedência
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (!idDoc) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc)
        );
        if (!idCadeia) {
            throw new ForbiddenException("Cadeia de assinatura não foi gerada.");
        }
        if (!await this.cadeiaAssRepository.buscarStatusCadeia(idCadeia)) {
            throw new ForbiddenException("Cadeia de assinatura NÃO está em andamento.");
        }

        //  Altera o status de assinatura
        const ordem = await this.ordemAssRepository.buscarAssinante(idCadeia);
        if (ordem) {
            const idOrdem = await this.ordemAssRepository.buscarIdOrdem(
                Number(idCadeia),
                ordem.idAssociadoAoProjeto
            );
            if (!await this.ordemAssRepository.buscarStatusAss(idOrdem)) {
                throw new ForbiddenException("Associado ainda não assinou.");
            }
            const statusAssinatura = 
                await this.ordemAssRepository.alterarNaoAssinou(idOrdem);
            if (!statusAssinatura) {
                return this.httpService.retorno(404, "Ordem do Associado");
            }
        } else {
            throw new ForbiddenException("Cadeia de assinatura já encerrada.");
        }

        await this.notificarRejeicao(ordem.idAssociadoAoProjeto, idProjeto);

        return this.httpService.retorno(200);
    }

    async excluirCadeia(
        idProjeto: number, 
        idUsuario: number
    ): Promise<any> {

        //  Verificações para procedência
        const correspondente = await this.associadosService.ehCorrespondente(
            idUsuario,
            idProjeto
        );
        if (!correspondente) {
            return this.httpService.retorno(403);
        }
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (!idDoc) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc)
        );
        if (!idCadeia) {
            throw new ForbiddenException("Cadeia de assinatura não foi gerada.");
        }
        
        await this.ordemAssRepository.excluirOrdens(Number(idCadeia));
        await this.cadeiaAssRepository.excluirCadeia(idCadeia);

        return this.httpService.retorno(204, "Cadeia de Assinatura");
    }

    async notificarAtualProx(idAtual: number, idProx: number): Promise<any> {

        //  Busca nome e email dos dois primeiros associados encontrados
        const atual = await this.associadoRepository.buscarNomeEmail(idAtual);
        if (!atual) {
            return "Oops! A cadeia foi iniciada, mas não foi possível notificar os associados pois suas informações não foram encontradas."
        }
        const prox = await this.associadoRepository.buscarNomeEmail(idProx);
        if (!prox) {
            return "Oops! A cadeia foi iniciada, mas não foi possível notificar os associados pois suas informações não foram encontradas."
        }
    
        //  Notifica os dois primeiros associados por email
        const nomeAtual = atual.usuario[0].nome.split(" ");
        const nomeProx = prox.usuario[0].nome.split(" ");
        try {
            this.mailService.notificarAssinantes(
                nomeAtual[0],
                atual.usuario[0].email,
                nomeProx[0],
                prox.usuario[0].email
            );
        } catch(error) {}
    }

    async notificarAtual(idAtual: number): Promise<any> {
        const atual = await this.associadoRepository.buscarNomeEmail(idAtual);
        if (!atual) {
            return "Oops! A cadeia foi iniciada, mas não foi possível notificar o associado pois suas informações não foram encontradas."
        }
        const nomeAtual = atual.usuario[0].nome.split(" ");
        try {
            this.mailService.notificarAtual(
                nomeAtual[0],
                atual.usuario[0].email,
            );
        } catch(error) {}
    }

    async notificarCorrespondente(
        idCorrespondente: number, 
        idAssociado: number
    ): Promise<any> {
        const correspondente = await this.associadoRepository.buscarNomeEmail(
            idCorrespondente
        );
        if (!correspondente) {
            return "Oops! As informações do correspondente não foram encontradas."
        }
        const associado = await this.associadoRepository.buscarNomeEmail(
            idAssociado
        );
        if (!associado) {
            return "Oops! As informações do associado não foram encontradas."
        }
        const nomeCorrespondente = correspondente.usuario[0].nome.split(" ");
        const nomeAssociado = associado.usuario[0].nome.split(" ");
        try {
            this.mailService.notificarCorrespondente(
                nomeAssociado[0],
                correspondente.usuario[0].email,
                nomeCorrespondente[0]
            );
        } catch(error) {}
    }

    async notificarRejeicao(
        idAssociado: number, 
        idProjeto: number
    ): Promise<any> {
        const associado = await this.associadoRepository.buscarNomeEmail(
            idAssociado
        );
        if (!associado) {
            return "Oops! As informações do associado não foram encontradas."
        }
        const projeto = await this.projetoRepository.buscarNomeProjeto(
            idProjeto
        );
        if (!projeto) {
            return "Oops! O projeto não foi encontrado."
        }
        const nome = associado.usuario[0].nome.split(" ");
        try {
            this.mailService.notificarRejeicao(
                nome[0],
                associado.usuario[0].email,
                projeto
            );
        } catch(error) {}
    }

    async verificarPosicao(
        idProjeto: number
    ): Promise<any> {
        
        //  Verificações de existência da cadeia
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (!idDoc) {
            throw new NotFoundException("Documento de assinatura não encontrado.")
        }
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc)
        );
        if (!idCadeia) {
            throw new NotFoundException("A cadeia não foi encontrada ou não foi gerada.")
        }

        //  Recebe atual e próximo associado
        const assinantes = await this.ordemAssRepository.buscarAssinante(idCadeia);
        const ordem = await this.ordemAssRepository.buscarOrdemCompleta(idCadeia);
        if(ordem){
            for (const idAssociado of ordem) {
                const idUsuario = await this.associadoRepository.buscarIdUsuario(idAssociado.idAssociadoAoProjeto);
                const nome = await this.usuarioRepository.buscarPorId(idUsuario.usuario[0].id);
                idAssociado.idUsuario = idUsuario.usuario[0].id;
                idAssociado.nome = nome.nome;
            }
            ordem.sort((a, b) => a.id - b.id);
            const dados = {
                idAtualAssinante: assinantes?.idAssociadoAoProjeto,
                idProximoAssinante: assinantes?.proximo?.idAssociadoAoProjeto,
                associadosOrdem: ordem
            }
            return dados;
        }
    }

    async verificarStatusCadeia(idProjeto: number): Promise<any> {
        const idDoc = await this.docAssRepository.buscarPorId(idProjeto);
        if (!idDoc) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const idCadeia = await this.cadeiaAssRepository.buscarIdCadeia(
            Number(idDoc)
        );
        if (!idCadeia) {
            throw new NotFoundException("A cadeia não foi encontrada ou não foi gerada.")
        }
        
        const statusEncerrada = await this.cadeiaAssRepository.buscarEncerrada(idCadeia);
        if (statusEncerrada === true) {
            const dados = {
                status: "Encerrada"
            }
            return dados;
        } else {
            const dados = {
                status: "Em Andamento"
            }
            return dados;
        }
    }
}

