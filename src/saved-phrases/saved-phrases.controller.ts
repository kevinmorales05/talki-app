import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SavedPhrasesService } from './saved-phrases.service.js';
import { CreateSavedPhraseDto } from './dto/create-saved-phrase.dto.js';

@Controller('saved-phrases')
export class SavedPhrasesController {
  constructor(private readonly savedPhrasesService: SavedPhrasesService) {}

  @Post()
  async create(@Body() createSavedPhraseDto: CreateSavedPhraseDto) {
    return this.savedPhrasesService.create(createSavedPhraseDto);
  }

  @Get(':userId/:kidId')
  async findByUserAndKid(@Param('userId') userId: string, @Param('kidId') kidId: string) {
    return this.savedPhrasesService.findByUserAndKid(userId, kidId);
  }
}
