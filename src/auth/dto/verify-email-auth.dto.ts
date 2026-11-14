import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailAuthDto {
    @IsString()
    @IsNotEmpty()
    token: string;
}