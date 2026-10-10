import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GamesService } from './games.service.js';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('topics')
  @ApiOperation({ summary: 'Get 20 practice game topics' })
  @ApiResponse({ status: 200, description: 'List of topics with IDs.' })
  getTopics() {
    return this.gamesService.getTopics();
  }

  @Post('generatePracticeGames')
  @ApiOperation({ summary: 'Generate 5 practice sentences with pictograms for a topic' })
  @ApiBody({ schema: { type: 'object', properties: { topic: { type: 'string', nullable: true } } } })
  @ApiResponse({ status: 201, description: 'Practice games generated.' })
  async generatePracticeGames(@Body('topic') topic?: string) {
    return this.gamesService.generatePracticeGames(topic);
  }
}
