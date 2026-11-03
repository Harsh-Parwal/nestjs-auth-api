import { IsEmail, IsString, Matches, MinLength } from 'class-validator'
export class SignupAuthDto {
    @IsString()
    @MinLength(2, { message: "Name must be atleast 2 characters" })
    name: string

    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    @Matches(/^(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
        message: 'Password must contain at least one number and one special charcter'
    })
    password: string
}
