import { Module } from '@nestjs/common';
import { ClassModulesController } from './class-modules.controller';
import { ClassModulesService } from './class-modules.service';

@Module({
  controllers: [ClassModulesController],
  providers: [ClassModulesService],
})
export class ClassModulesModule {}
