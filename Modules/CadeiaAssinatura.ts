import { Module } from "@nestjs/common";
import { CadeiaAssinaturaController } from "src/Controllers/CadeiaAssinaturaController";
import { AnexoRepository } from "src/Repositories/AnexoRepository";
import { AssociadosAoProjetoRepository } from "src/Repositories/AssociadosAoProjetoRepository";
import { CadeiaAssinaturaRepository } from "src/Repositories/CadeiaAssinaturaRepository";
import { ClasseRepository } from "src/Repositories/ClasseRepository";
import { DocAssinaturaRepository } from "src/Repositories/DocAssinaturaRepository";
import { LogAtualizacoesRepository } from "src/Repositories/LogAtualizacoesRepository";
import { MinioRepository } from "src/Repositories/MinioRepository";
import { ModeloDocumentoRepository } from "src/Repositories/ModeloDocumentoRepository";
import { ModeloParticipacaoRepository } from "src/Repositories/ModeloParticipacaoRepository";
import { OrdemAssinaturaRepository } from "src/Repositories/OrdemAssinaturaRepository";
import { ParticipacaoClasseRepository } from "src/Repositories/ParticipacaoClasseRepository";
import { ParticipacaoRepository } from "src/Repositories/ParticipacaoRepository";
import { ProjetoRepository } from "src/Repositories/ProjetoRepository";
import { QuantidadeEnvolvidosRepository } from "src/Repositories/QuantidadeEnvolvidosRepository";
import { StatusDeFinalizacaoRepository } from "src/Repositories/StatusDeFinalizacaoRepository";
import { UsuarioRepository } from "src/Repositories/UsuarioRepository";
import { AnexoService } from "src/Services/AnexoService";
import { AssociadosAoProjetoService } from "src/Services/AssociadosAoProjetoService";
import { CadeiaAssinaturaService } from "src/Services/CadeiaAssinaturaService";
import { ClasseService } from "src/Services/ClasseService";
import { DocAssinaturaService } from "src/Services/DocAssinaturaService";
import { HttpService } from "src/Services/HttpService";
import { LogAtualizacoesService } from "src/Services/LogAtualizacoesService";
import { MinioService } from "src/Services/MinioService";
import { ModeloDocumentoService } from "src/Services/ModeloDocumentoService";
import { ModeloParticipacaoService } from "src/Services/ModeloParticipacaoService";
import { ParticipacaoClasseService } from "src/Services/ParticipacaoClasseService";
import { ParticipacaoService } from "src/Services/ParticipacaoService";
import { ProjetoService } from "src/Services/ProjetoService";
import { QuantidadeEnvolvidosService } from "src/Services/QuantidadeEnvolvidosService";
import { StatusDeFinalizacaoService } from "src/Services/StatusDeFinalizacaoService";
import { TokenJWTService } from "src/Services/TokenJWTService";
import { UsuarioService } from "src/Services/UsuarioService";
import { TemplatePDF } from "src/templates/TemplatesPDF";


@Module({
    imports: [],
    controllers: [CadeiaAssinaturaController],
    providers: [
        CadeiaAssinaturaService,
        CadeiaAssinaturaRepository,
        DocAssinaturaRepository,
        OrdemAssinaturaRepository,
        AssociadosAoProjetoRepository,
        AssociadosAoProjetoService,
        DocAssinaturaService,
        MinioRepository,
        MinioService,
        LogAtualizacoesRepository,
        LogAtualizacoesService,
        ProjetoRepository,
        TemplatePDF,
        ParticipacaoService,
        ParticipacaoRepository,
        ParticipacaoClasseRepository,
        UsuarioRepository,
        ClasseRepository,
        HttpService,
        ClasseService,
        ModeloParticipacaoRepository,
        TokenJWTService,
        ProjetoService,
        UsuarioService,
        ModeloParticipacaoService,
        ParticipacaoClasseService,
        StatusDeFinalizacaoService,
        StatusDeFinalizacaoRepository,
        Object,
        AnexoService,
        AnexoRepository,
        QuantidadeEnvolvidosService,
        QuantidadeEnvolvidosRepository,
        ModeloDocumentoService,
        ModeloDocumentoRepository
    ]
})
export class CadeiaAssinatura {}
