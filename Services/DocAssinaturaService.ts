import { Injectable, NotFoundException } from "@nestjs/common";
import { DocAssinaturaRepository } from "src/Repositories/DocAssinaturaRepository";
import { LogAtualizacoesRepository } from "src/Repositories/LogAtualizacoesRepository";
import { MinioRepository } from "src/Repositories/MinioRepository";
import { HttpService } from "./HttpService";
import { AssociadosAoProjetoRepository } from "src/Repositories/AssociadosAoProjetoRepository";
const NOME_ARQUIVO = "DocumentoAssinatura.pdf";


@Injectable()
export class DocAssinaturaService {
    constructor(
        private readonly docAssinaturaRepository: DocAssinaturaRepository,
        private readonly minioRepository: MinioRepository,
        private readonly logRepository: LogAtualizacoesRepository,
        private readonly httpService: HttpService,
        private readonly associadosRepository: AssociadosAoProjetoRepository
    ) {}

    async visualizarDocAssinatura(
        idProjeto: number,
        idUsuario: number
    ): Promise<any> {
        
        //  Verifica existência do Doc de Assinatura e se o usuário é associado
        const docAss = 
            await this.docAssinaturaRepository.visualizarDocAssinatura(
                idProjeto
            );
        if (!docAss) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        } 
        const associado = await this.associadosRepository.buscarId(
            idUsuario, 
            idProjeto
        );
        if (associado === -1) {
            return this.httpService.retorno(403);
        }

        //  Doc de Assinatura desativado
        if (docAss.documentoAssinatura.length === 0) {
            throw new NotFoundException("Documento de Assinatura inexistente ou desativado.");
        }
        const linkDocAss = await this.minioRepository.gerarLinkAcesso(
            String(idProjeto), 
            NOME_ARQUIVO, 
            docAss.documentoAssinatura[0].idVersao
        );
        if (linkDocAss) {
            return linkDocAss;
        } else {
            return this.httpService.retorno(404, "Link do Documento de Assinatura");
        }
    }

    async desativarDocAssinatura(
        idProjeto: number,
        idUsuario: number
    ): Promise<any> {
        
        //  Verifica existência do Documento e se o usuário é correspondente
        const ativo = await this.docAssinaturaRepository.checarAtivo(idProjeto);
        if (ativo === undefined) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const correspondente = await this.associadosRepository.ehCorrespondente(
            idUsuario, 
            idProjeto
        );
        if (!correspondente) {
            return this.httpService.retorno(403);
        }
        if (!ativo) {
            return this.httpService.retorno(200);
        }

        //  Desativa Doc de Assinatura
        const docAss = 
            await this.docAssinaturaRepository.desativarDocAssinatura(
                idProjeto
            );
        if (!docAss) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }

        //  Gera Log
        const idDocumento = 
            await this.docAssinaturaRepository.buscarPorId(idProjeto);
        if (!idDocumento) {
            return this.httpService.retorno(404, "Documento de Assinatura");
        }
        const novoLog = await this.logRepository.novoLog(
            undefined,
            idProjeto,
            NOME_ARQUIVO,
            idDocumento);
        if (novoLog && docAss) {
            return this.httpService.retorno(200);
        }
    }
}
