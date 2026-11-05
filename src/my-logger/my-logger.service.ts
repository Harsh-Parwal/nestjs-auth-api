import { ConsoleLogger, Injectable } from '@nestjs/common';
import { promises as fsPromises } from 'fs'
import * as path from 'path'


@Injectable()
export class MyLoggerService extends ConsoleLogger {
    private readonly logDir = path.join(process.cwd(), 'logs');
    private readonly logFile = path.join(this.logDir, 'myLogFile.log');

    async logToFile(entry: any) {
        const formattedEntry = `${Intl.DateTimeFormat('en-US', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
        }).format(new Date())}\t${entry}\n`;

        try {
            await fsPromises.mkdir(this.logDir, { recursive: true });
            await fsPromises.appendFile(this.logFile, formattedEntry);
        } catch (e) {
            if (e instanceof Error) console.error(e.message);
        }
    }

    log(message: any, context?: string) {
        const ctx = context ?? this.context ?? '';
        const entry = `LOG\t${ctx}\t${message}`;
        this.logToFile(entry);
        super.log(message, ctx);
    }
}
