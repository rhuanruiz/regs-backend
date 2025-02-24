import { Injectable } from "@nestjs/common";
import { CadeiaAssinatura } from "@prisma/client";
import { PrismaService } from "src/Services/PrismaService";


@Injectable()
export class CadeiaAssinaturaRepository {
    constructor(
        private readonly prismaService: PrismaService 
    ) {}

    async criarCadeia(idDoc: number): Promise<CadeiaAssinatura> {
        const cadeia = await this.prismaService.cadeiaAssinatura.create({
            data: {
                dataDeEncaminhamento: new Date(),
                documentoAssinaturaId: Number(idDoc)
            }
        });
        if (cadeia) {
            return cadeia;  
        }
    }

    async buscarIdCadeia(idDoc: number): Promise<number> {
        const idCadeia = await this.prismaService.cadeiaAssinatura.findFirst({
            where: {
                documentoAssinaturaId: idDoc
            }
        });
        if (idCadeia) {
            return idCadeia.id;
        }
    }

    async buscarStatusCadeia(idCadeia:number): Promise<boolean> {
        const status = await this.prismaService.cadeiaAssinatura.findFirst({
            where: {
                id: idCadeia
            }
        });
        if (status) {
            return status.statusDaCadeia;
        }
    }

    async alterarStatusTrue(idCadeia: number): Promise<CadeiaAssinatura> {
        return await this.prismaService.cadeiaAssinatura.update({
            where: {
                id: idCadeia,
                statusDaCadeia: false
            },
            data: {
                statusDaCadeia: true
            },
        });
    }

    async alterarStatusFalse(idCadeia: number): Promise<CadeiaAssinatura> {
        return await this.prismaService.cadeiaAssinatura.update({
            where: {
                id: idCadeia,
                statusDaCadeia: true
            },
            data: {
                statusDaCadeia: false
            },
        });
    }

    async atualizarIdDocumento(
        idCadeia: number, 
        idDoc: number
    ): Promise<CadeiaAssinatura> {
        return await this.prismaService.cadeiaAssinatura.update({
            where: {
                id: idCadeia
            },
            data: {
                documentoAssinaturaId: idDoc
            }
        });
    }

    async buscarEncerrada(idCadeia: number): Promise<boolean> {
        const status = await this.prismaService.cadeiaAssinatura.findFirst({
            where: {
                id: idCadeia
            }
        });
        if (status) {
            return status.encerrada;
        }
    }

    async alterarEncerrada(idCadeia: number): Promise<CadeiaAssinatura> {
        return await this.prismaService.cadeiaAssinatura.update({
            where: {
                id: idCadeia,
                encerrada: false
            },
            data: {
                encerrada: true
            },
        });
    }

    async excluirCadeia(idCadeia: number): Promise<CadeiaAssinatura> {
        return await this.prismaService.cadeiaAssinatura.delete({
            where: {
                id: idCadeia
            }
        });
    }
}
