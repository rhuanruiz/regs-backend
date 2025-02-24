import { Injectable } from '@nestjs/common';
import { OrdemAssinatura } from '@prisma/client';
import { PrismaService } from 'src/Services/PrismaService';


@Injectable()
export class OrdemAssinaturaRepository {
    constructor(private readonly prismaService: PrismaService) {}

    async buscarIdOrdem(
        idCadeia: number, 
        idAssociado: number
    ): Promise<number> {
        const ordem = await this.prismaService.ordemAssinatura.findFirst({
            where: {
                cadeiaId: idCadeia,
                idAssociadoAoProjeto: idAssociado
            }
        });
        if (ordem) {
            return ordem.id;
        }
    }

    async buscarUltimoId(idCadeia: number): Promise<number> {
        const ordem = await this.prismaService.ordemAssinatura.findFirst({
            where: {
                cadeiaId: idCadeia,
                proximoId: null
            }
        });
        if (ordem) {
            return ordem.id;
        }
    }

    async incluirPrimeiroAssociado(
        idCadeia: number, 
        idAssociado: number
    ): Promise<OrdemAssinatura> {
        const ordem = await this.prismaService.ordemAssinatura.create({
            data: {
                cadeiaId: idCadeia,
                idAssociadoAoProjeto: idAssociado,
                assinou: false
            }
        });
        if (ordem) {
            return ordem;
        }
    }

    async incluirAssociado(
        idCadeia: number,
        idAssociado: number
    ): Promise<OrdemAssinatura> {
        const associadoAnterior = await this.buscarUltimoId(idCadeia);
        const ordem = await this.prismaService.ordemAssinatura.update({
            where: {
                id: Number(associadoAnterior)
            },
            data: {
                proximo: {
                    create: {
                        cadeiaId: idCadeia,
                        idAssociadoAoProjeto: idAssociado,
                        assinou: false
                    }
                }
            },
            include: {
                anterior: true
            }
        });
        if (ordem) {
            return ordem;
        }
    }

    async buscarAssinante(
        idCadeia: number
    ): Promise<{idAssociadoAoProjeto: number} 
                & {proximo: {idAssociadoAoProjeto: number}}> {
        const assi = await this.prismaService.ordemAssinatura.findFirst({
            where: {
                cadeiaId: idCadeia,
                aprovacao: false
            },
            select: {
                idAssociadoAoProjeto: true,
                proximo: {
                    select: {
                        idAssociadoAoProjeto: true
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }  
        });
        if (assi) {
            return assi;
        }
    }

    async atualizarDataAssinatura(idOrdem: number): Promise<OrdemAssinatura> {
        return await this.prismaService.ordemAssinatura.update({
            where: {
                id: idOrdem
            },
            data: {
                dataDeAssinatura: new Date()
            }
        });
    }

    async buscarStatusAss(idOrdem: number): Promise<boolean> {
        const status = await this.prismaService.ordemAssinatura.findFirst({
            where: {
                id: idOrdem
            }
        });
        if (status) {
            return status.assinou;
        }
    }

    async alterarAssinou(idOrdem: number): Promise<OrdemAssinatura> {
        return await this.prismaService.ordemAssinatura.update({
            where: {
                id: idOrdem
            },
            data: {
                assinou: true
            }
        });
    }

    async alterarNaoAssinou(idOrdem: number): Promise<OrdemAssinatura> {
        return await this.prismaService.ordemAssinatura.update({
            where: {
                id: idOrdem
            },
            data: {
                assinou: false
            }
        });
    }

    async buscarStatusAprovacao(idOrdem: number): Promise<boolean> {
        const status = await this.prismaService.ordemAssinatura.findFirst({
            where: {
                id: idOrdem
            }
        });
        if (status) {
            return status.aprovacao;
        }
    }

    async alterarStatusAprovacao(
        idOrdem: number
    ): Promise<OrdemAssinatura> {
        return await this.prismaService.ordemAssinatura.update({
            where: {
                id: idOrdem
            },
            data: {
                aprovacao: true
            }
        });
    }

    async excluirOrdens(idCadeia: number): Promise<boolean> {
        const ordem = await this.prismaService.ordemAssinatura.deleteMany({
            where: {
                cadeiaAssinatura: {
                    id: idCadeia
                }
            }
        });
        if (ordem) {
            return true;
        }
    }

    async buscarIdAssociado(idOrdem: number): Promise<number> {
        const ordem = await this.prismaService.ordemAssinatura.findFirst({
            where: {
                id: idOrdem
            }
        });
        if (ordem) {
            return ordem.idAssociadoAoProjeto;
        }
    }

    async buscarOrdemCompleta(idCadeia: number): Promise<any> {
        const ordem = await this.prismaService.ordemAssinatura.findMany({
            where: {
                cadeiaId: idCadeia
            }
        });
        return ordem;
    }
}
