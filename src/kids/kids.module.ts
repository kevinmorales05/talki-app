import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KidsController } from './kids.controller.js';
import { KidsService } from './kids.service.js';
import { Kid, KidSchema } from './schemas/kid.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Kid.name, schema: KidSchema }])],
  controllers: [KidsController],
  providers: [KidsService],
})
export class KidsModule {}
