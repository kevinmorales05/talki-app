import { Module } from '@nestjs/common';
import { EmojiService } from './emoji.service.js';
import { OpenaiModule } from '../openai/openai.module.js';

@Module({
  imports: [OpenaiModule],
  providers: [EmojiService],
  exports: [EmojiService],
})
export class EmojiModule {}
