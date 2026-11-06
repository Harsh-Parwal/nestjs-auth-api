import { Module } from '@nestjs/common';
import { MyLoggerService } from './my-logger.service.js';

@Module({
  providers: [MyLoggerService],
  exports: [MyLoggerService]
  // needed only if you want to DI this service in some other module
})
export class MyLoggerModule { }
