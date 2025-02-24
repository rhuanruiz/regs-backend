import { 
    Controller, 
    Get, 
    Param, 
    Put, 
    Query,
    Request, 
    UseGuards
} from "@nestjs/common";
import { AuthGuard } from "src/Guards/AuthGuard";
import { PermissaoGuard } from "src/Guards/PermissaoGuard";
import { DocAssinaturaService } from "src/Services/DocAssinaturaService";


@Controller("docAssinatura")
export class DocAssinaturaController {
    constructor( 
        private readonly docAssinaturaService: 
        DocAssinaturaService 
    ) {}

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente", "AssociadoAutor", "DesenvolvedorAutor"]))
    @Get()
    visualizarDocumentoAssinatura(
        @Request() request,
        @Query("idProjeto") idProjeto: number
    ): Promise<{}> {
        const idUsuario = request.usuario.usuario.id;
        return this.docAssinaturaService.visualizarDocAssinatura(
            Number(idProjeto),
            Number(idUsuario)
        );
    }

    @UseGuards(AuthGuard, PermissaoGuard(["Correspondente"]))
    @Put("desativar/:id")
    desativarDocAssinatura(
        @Request() request,
        @Param("id") idProjeto: number
    ): Promise<{}> {
        const idUsuario = request.usuario.usuario.id;
        return this.docAssinaturaService.desativarDocAssinatura(
            Number(idProjeto),
            Number(idUsuario)
        );
    }
}
