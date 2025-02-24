import { Module } from "@nestjs/common";
import { LoginService } from "../Services/LoginService";
import { LoginController } from "../Controllers/LoginController";
import { Usuario } from "./Usuario";
import { TokenJWTService } from "src/Services/TokenJWTService";


@Module({
    imports: [Usuario],
    providers: [LoginService, TokenJWTService],
    controllers: [LoginController],
    exports: [LoginService],
})
export class Login {}
