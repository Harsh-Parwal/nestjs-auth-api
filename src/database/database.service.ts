import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(config: ConfigService) {
        const adapter = new PrismaPg({ connectionString: config.getOrThrow<string>('DATABASE_URL'),});
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        console.log('DB CONNECTED via PRISMA', process.env.DATABASE_URL);
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('Disconnected')
    }
}
