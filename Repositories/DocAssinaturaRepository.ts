import { Injectable } from "@nestjs/common";
import { Anexo, DocumentoAssinatura } from "@prisma/client";
import { PrismaService } from "src/Services/PrismaService";


@Injectable()
export class DocAssinaturaRepository {
    constructor(private readonly prismaService: PrismaService) {}

    async cadastrarPrimeiroDocumentoAssinatura(
        linkDocAss: string, 
        idAnexo: number, 
        idVersao: string
    ): Promise<DocumentoAssinatura> {
        const docAss = await this.prismaService.documentoAssinatura.create({
            data: {
                linkDocumentoAssinatura: linkDocAss,
                anexoId: Number(idAnexo),
                idVersao,
                ativo: true
            },
        })
        return docAss;
    }

    async cadastrarNovoDocumentoAssinatura(
        linkDocAss: string,
        anexoId: number,
        idVersao: string
    ): Promise<DocumentoAssinatura> {
        const versaoAntiga = await this.buscarPorId(anexoId);
        const docAss = await this.prismaService.documentoAssinatura.update({
            where: {
                id: Number(versaoAntiga)
            },
            data: {
                ativo: false,
                versaoAtual: {
                    create: {
                        linkDocumentoAssinatura: linkDocAss,
                        anexoId: Number(anexoId),
                        idVersao,
                        ativo: true
                    }
                }
            },
            include: {
                versaoAntiga: true
            }
        });
        if (docAss) {
            return docAss;
        }
    }

    async receberStatusCadeira(
        idProjeto: number
    ): Promise<DocumentoAssinatura[]> {
        const status = await this.prismaService.documentoAssinatura.findMany({
            where: {
                anexoId: Number(idProjeto),
                versaoAtualId: null
            },
        })
        if (status) {
            return status;
        }
    }

    async visualizarDocAssinatura(
        idProjeto: number
    ): Promise<Anexo & {documentoAssinatura: {idVersao: string} []}> {
        const docAss = await this.prismaService.anexo.findUnique({
            where: {
                idProjeto: Number(idProjeto)
            },
            include: {
                documentoAssinatura: {
                    where: {
                        versaoAtualId: null,
                        ativo: true
                    },
                    select: {
                        idVersao: true
                    }
                }
            }
        })
        if (docAss) {
            return docAss;
        }
    }

    async buscarPorId(idProjeto: number): Promise<number> {
        const docAss = await this.prismaService.documentoAssinatura.findFirst({
            where: {
                anexoId: Number(idProjeto),
                versaoAtualId: null
            }
        })
        if (docAss) {
            return docAss.id;
        }
    }

    async checarAtivo(idProjeto: number): Promise<boolean> {
        const ativo = await this.prismaService.documentoAssinatura.findFirst({
            where: {
                anexoId: Number(idProjeto),
                versaoAtualId: null
            }
        });
        if (ativo) {
            return ativo.ativo;
        }
    }

    async desativarDocAssinatura(idProjeto: number): Promise<boolean> {
        const docAssinatura = 
            await this.prismaService.documentoAssinatura.updateMany({
                where: {
                    anexoId: Number(idProjeto),
                    versaoAtualId: null
                }, 
                data: {
                    ativo: false
                }
            });
        if (docAssinatura) {
            return true;
        }
    }
}
