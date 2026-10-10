import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { OpenaiModule } from '../openai/openai.module.js';
import { PictogramsModule } from '../pictograms/pictograms.module.js';
import { GamesModule } from '../games/games.module.js';

@Module({
  imports: [OpenaiModule, PictogramsModule, GamesModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
