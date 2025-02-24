import { 
    Body,
    Controller, 
    Delete, 
    Get,  
    Post, 
    Query, 
    Request,
    UseGuards
} from "@nestjs/common";
import { AuthGuard } from "src/Guards/AuthGuard";
import { PermissaoGuard } from "src/Guards/PermissaoGuard";
import { CadeiaAssinaturaService } from "src/Services/CadeiaAssinaturaService";

@Controller("cadeiaAssinatura")
export class CadeiaAssinaturaController {
    constructor(
        private readonly cadeiaAssinaturaService: CadeiaAssinaturaService
    ) {}

    //  Inclui, gera e inicia a cadeia
    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente"]))
    @Post("incluirAssociado")
    incluirAssociadoNaCadeia(
        @Request() request,
        @Body()
            dados: {
                idProjeto: number,
                idAssociados: number[]
            }
    ): Promise<{}> {
        const idCorrespondente = request.usuario.usuario.id;
        return this.cadeiaAssinaturaService.incluirAssociado(
            Number(dados.idProjeto),
            Number(idCorrespondente),
            dados.idAssociados
        );
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente", "AssociadoAutor", "DesenvolvedorAutor"]))
    @Get("receberDocumento")
    receberDocumento(
        @Request() request,
        @Query("idProjeto") idProjeto: number
    ): Promise<{}> {
        const idAssociado = request.usuario.usuario.id;
        return this.cadeiaAssinaturaService.receberDocumento(
            Number(idProjeto),
            Number(idAssociado)
        );
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente", "AssociadoAutor", "DesenvolvedorAutor"]))
    @Post("enviarDocumento")
    enviarDocumento(
        @Request() request,
        @Body() 
            dados: { 
                idProjeto: number,
                docAssPDF: string 
            }
    ): Promise<{}> {
        const idAssociado = request.usuario.usuario.id;
        const { docAssPDF, idProjeto } = dados;
        return this.cadeiaAssinaturaService.enviarDocumento(
            Number(idProjeto),
            Number(idAssociado),
            docAssPDF
        );
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente"]))
    @Delete("excluirCadeia/:id")
    excluirCadeia(
        @Request() request,
        @Param("id") idProjeto: number
    ): Promise<{}> {
        const idCorrespondente = request.usuario.usuario.id;
        return this.cadeiaAssinaturaService.excluirCadeia(
            Number(idProjeto),
            Number(idCorrespondente)
        );
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente", "AssociadoAutor", "DesenvolvedorAutor"]))
    @Get("posicao")
    verificarPosicao(
        @Query("idProjeto") idProjeto: number
    ): Promise<{}> {
        return this.cadeiaAssinaturaService.verificarPosicao(
            Number(idProjeto)
        );
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente", "AssociadoAutor", "DesenvolvedorAutor"]))
    @Get("status")
    verificarStatusCadeia(
        @Query("idProjeto") idProjeto: number
    ): Promise<{}> {
        return this.cadeiaAssinaturaService.verificarStatusCadeia(
            Number(idProjeto)
        );
    }
}
