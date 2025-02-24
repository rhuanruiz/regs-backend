import { AuthGuard } from "src/Guards/AuthGuard";
import { LoginService } from "src/Services/LoginService";
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards,
} from "@nestjs/common";


@Controller()
export class LoginController {
    constructor(private loginService: LoginService) { }
    
    @HttpCode(HttpStatus.OK)
    @Post("login")
    logar(@Body() entrar: Record<string, any>) {
        return this.loginService.logar(entrar.login, entrar.senha);
    }
    
    @UseGuards(AuthGuard)
    @Get("perfil")
    obterPerfil(@Request() req) {
        return req.usuario;
    }
}
