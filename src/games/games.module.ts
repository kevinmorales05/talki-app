import { Module } from '@nestjs/common';
import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';
import { OpenaiModule } from '../openai/openai.module.js';
import { PictogramsModule } from '../pictograms/pictograms.module.js';

@Module({
  imports: [OpenaiModule, PictogramsModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
