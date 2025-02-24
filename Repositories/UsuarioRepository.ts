import { Injectable } from "@nestjs/common";
import { Usuario } from "@prisma/client";
import { PrismaService } from "src/Services/PrismaService";


@Injectable()
export class UsuarioRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) {}

    async criarPorConvite(dadosUsuario: {
        login: string;
        senha: string;
        email: string;
        cpf: string;
        nome: string;
        naturezaJuridica: boolean;
        qualificacao: string;
        statusDeContato: boolean;
    }, senhaHash): Promise<Usuario> {
        const {
            login,
            email,
            cpf,
            nome,
            naturezaJuridica,
            statusDeContato,
            qualificacao
        } = dadosUsuario;
        return await this.prismaService.usuario.create({
            data: {
                login,
                senha: senhaHash,
                email,
                cpf,
                nome,
                naturezaJuridica,
                statusDeContato,
                qualificacao
            }
        });
    }

    async buscarPorLogin(
        login: string
    ): Promise<any> {
        return await this.prismaService.usuario.findFirst({
            where: {
                login: login
            },
            include: {
                nivelPermissao: {
                    select: {
                        id: true,
                        nivelPermissao: true,
                        projeto: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });
    }

    async buscarPorEmail(emailReceived) {
        return await this.prismaService.usuario.findFirst({
            where: {
                email: emailReceived
            }
        }); 
    }

    async buscarPermissoes(
        idUsuario: number
    ): Promise<{}> {
        const resultado = await this.prismaService.usuario.findMany({
            where: {
                id: idUsuario
            },
            select: {
                nivelPermissao: {
                    select: {
                        id: true,
                        nivelPermissao: true,
                        projeto: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });

        if (resultado) {
            const permissoes = resultado[0].nivelPermissao.map(
                permissao => ({
                    idAssociado: permissao.id,
                    nivelPermissao: permissao.nivelPermissao,
                    idProjeto: permissao.projeto[0].id
                }));
            return permissoes;
        }
    }     
}
