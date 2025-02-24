import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { config } from "dotenv-safe";
import { HttpService } from "./HttpService";


config({silent: true});

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly httpRetorno: HttpService
    ) {}

    async notificarAssinantes(
        nomeAssociadoAtual: string, 
        emailAtual: string, 
        nomeAssociadoProx: string, 
        emailProx: string
    ) {
        try {
            Promise.all([
                await this.mailerService.sendMail({
                    to: emailAtual,
                    subject: "AGORA É A SUA VEZ DE ASSINAR!",
                    template: "../templates/AtualAssinar",
                    context: {
                        nomeAssociado: nomeAssociadoAtual
                    }
                }),
                await this.mailerService.sendMail({
                    to: emailProx,
                    subject: "ATENÇÃO, VOCÊ SERÁ O PRÓXIMO A ASSINAR!",
                    template: "../templates/ProximoAssinar",
                    context: {
                        nomeAssociado: nomeAssociadoProx
                    }
                }),

            ]);
        } catch (error) {
            console.log(error);
            return this.httpRetorno.retorno(500);
        }

    }

    async notificarAtual(nomeAssociadoAtual: string, emailAtual: string) {
        try {
            await this.mailerService.sendMail({
                to: emailAtual,
                subject: "AGORA É A SUA VEZ DE ASSINAR!",
                template: "../templates/AtualAssinar",
                context: {
                    nomeAssociado: nomeAssociadoAtual
                }
            });
        } catch (error) {
            console.log(error);
            return this.httpRetorno.retorno(500);
        }

    }

    async notificarCorrespondente(
        nomeAssociado: string, 
        email: string, 
        nomeCorrespondente: string
    ) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: "DOCUMENTO PENDENTE DE APROVAÇÃO",
                template: "../templates/AprovacaoCorrespondente",
                context: {
                    nomeAssociado: nomeAssociado,
                    nomeCorrespondente: nomeCorrespondente
                }
            });
        } catch (error) {
            console.log(error);
            return this.httpRetorno.retorno(500);
        }
    }

    async notificarRejeicao(
        nomeAssociado: string,
        email: string,
        nomeProjeto: string
    ) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: "ATENÇÃO: O DOCUMENTO FOI REJEITADO",
                template: "../templates/DocumentoRejeitado",
                context: {
                    nomeAssociado: nomeAssociado,
                    nomeProjeto: nomeProjeto
                }
            });
        } catch (error) {
            console.log(error);
            return this.httpRetorno.retorno(500);
        } 
    }

    async convidarProjeto(
        nomeAssociado: string,
        email: string,
        nomeProjeto: string,
        url: string, 
        token: string
    ) {

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: "CONVITE DO PROJETO " + nomeProjeto,
                template: "../templates/ConviteProjeto",
                context: {
                    nomeAssociado: nomeAssociado,
                    nomeProjeto: nomeProjeto,
                    url: url + "/projeto/aceitarConvite?token=" + token
                }
            });
        } catch (error) {
            console.log(error);
            return this.httpRetorno.retorno(500)
        }
        
    }

    async contaCriada(
        nomeAssociado: string,
        nomeProjeto: string,
        senha: string,
        email: string,
        login: string
    ) {

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: "SUA CONTA FOI CRIADA COM SUCESSO",
                template: "../templates/ContaCriada",
                context: {
                    nomeAssociado: nomeAssociado,
                    nomeProjeto: nomeProjeto,
                    login: login,
                    senha: senha
                }
            });
        } catch (error) {
            console.log(error);
            return this.httpRetorno.retorno(500);
        }
    }

    async usuarioFoiAssociado(
        email: string,
        nomeAssociado: string,
        nivelPermissao: string,
        nomeProjeto: string
    ){
        if (nivelPermissao === "DesenvolvedorAutor"){
            nivelPermissao = "Desenvolvedor Autor"
        }
        if (nivelPermissao === "AssociadoAutor"){
            nivelPermissao = "Associado Autor"
        }
        await this.mailerService.sendMail({
            to: email,
            subject: "VOCÊ FOI ASSOCIADO A UM PROJETO",
            template: "../templates/UsuarioFoiAssociado",
            context: {
                nomeAssociado: nomeAssociado,
                nivelPermissao: nivelPermissao,
                nomeProjeto: nomeProjeto,
            }
        })
    }
}
