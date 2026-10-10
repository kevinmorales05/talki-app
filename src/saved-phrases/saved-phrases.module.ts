import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedPhrasesController } from './saved-phrases.controller.js';
import { SavedPhrasesService } from './saved-phrases.service.js';
import { SavedPhrase, SavedPhraseSchema } from './schemas/saved-phrase.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SavedPhrase.name, schema: SavedPhraseSchema }]),
  ],
  controllers: [SavedPhrasesController],
  providers: [SavedPhrasesService],
  exports: [SavedPhrasesService],
})
export class SavedPhrasesModule {}
