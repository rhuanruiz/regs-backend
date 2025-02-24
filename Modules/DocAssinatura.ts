import { Module } from "@nestjs/common";
import { DocAssinaturaController } from "src/Controllers/DocAssinaturaController";
import { AssociadosAoProjetoRepository } from "src/Repositories/AssociadosAoProjetoRepository";
import { DocAssinaturaRepository } from "src/Repositories/DocAssinaturaRepository";
import { LogAtualizacoesRepository } from "src/Repositories/LogAtualizacoesRepository";
import { MinioRepository } from "src/Repositories/MinioRepository";
import { DocAssinaturaService } from "src/Services/DocAssinaturaService";
import { HttpService } from "src/Services/HttpService";
import { MinioService } from "src/Services/MinioService";
import { TokenJWTService } from "src/Services/TokenJWTService";


@Module({
    imports: [],
    controllers: [DocAssinaturaController],
    providers: [
        DocAssinaturaService,
        DocAssinaturaRepository,
        MinioService,
        MinioRepository,
        LogAtualizacoesRepository,
        TokenJWTService,
        HttpService,
        AssociadosAoProjetoRepository
    ]
})
export class DocAssinatura {}
