import { Body, Controller, Get, Request} from "@nestjs/common";
import { ProjetoService } from "src/Services/ProjetoService";
import { Delete, Post, Put, Query, UseGuards } from "@nestjs/common/decorators";
import { AuthGuard } from "src/Guards/AuthGuard";
import { PermissaoGuard } from "src/Guards/PermissaoGuard";


@Controller("projeto")
export class ProjetoController {
    constructor(
        private readonly projetoService: ProjetoService
    ) {}
    
    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente"]))
    @Delete("removerAssociado")
    removerAssociado(
        @Request() request,
        @Query("idProjeto") idProjeto: number,
        @Query("idAssociado") idAssociado: number,
    ): Promise<{}> {
        const idUsuario = request.usuario.usuario.id;
        return this.projetoService.removerAssociado(
            Number(idProjeto), 
            Number(idUsuario),
            Number(idAssociado),
        );
    } 
    
    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente"]))
    @Post("incluirAutor")
    incluirAutor(
        @Request() request,
        @Body()
            dados: {
                idProjeto: number,
                idAutor: number, // id do usuário a ser incluído
                nivelPermissao: string
            }
    ): Promise<{}> {

        // id do usuário fazendo a requisição
        const idCorrespondente = request.usuario.usuario.id;  
        return this.projetoService.incluirAutor(idCorrespondente, dados);
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente"]))
    @Post("incluirNaoAutor")
    incluirNaoAutor(
        @Request() request,
        @Body()
            dados: {
                idProjeto: number,
                nomeNaoAutor: string,
                nivelPermissao: string
            }
    ): Promise<{}> {
        const idCorrespondente = request.usuario.usuario.id; 
        return this.projetoService.incluirNaoAutor(
            Number(idCorrespondente), 
            dados
        );
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente"]))
    @Post("convidarAssociado")
    convidarAssociado(
        @Request() request,
        @Body()
            dados: {
                idProjeto: number,
                url: string,
                email: string, 
                nivelPermissao: string,
                nome: string
            }
    ): Promise<{}> {
        const idUsuario = request.usuario.usuario.id;
        return this.projetoService.convidarAssociado(idUsuario, dados);
    }

    @Get("aceitarConvite")
    aceitarConvite(
        @Query("token") token: string
    ): Promise<{}> {
        return this.projetoService.aceitarConvite(token);
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente", "AssociadoAutor", "DesenvolvedorAutor"]))
    @Put("concordarDiscordar/:id")
    concordarDiscordar(
        @Request() request,
        @Param("id") idProjeto: number,
        @Body()
            dados: {
                status: boolean
            }
    ): Promise<{}> {
        const idUsuario = request.usuario.usuario.id;
        return this.projetoService.concordarDiscordar(
            Number(idProjeto),
            Number(idUsuario),
            dados
        );
    }
}
