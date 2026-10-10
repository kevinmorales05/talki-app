import { Controller, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PictogramsService } from './pictograms.service.js';

@ApiTags('pictograms')
@Controller('pictograms')
export class PictogramsController {
  constructor(private readonly pictogramsService: PictogramsService) {}

  @Post('build-database')
  @ApiOperation({ summary: 'Build the internal database with pictograms, tags, and categories from ARASAAC API' })
  @ApiQuery({ name: 'language', required: false, description: 'Language code (e.g., en, es)', default: 'en' })
  @ApiQuery({ name: 'resolution', required: false, description: 'Image resolution (300, 500, or 2500)', enum: [300, 500, 2500], default: 300 })
  @ApiResponse({ status: 201, description: 'Database successfully built.' })
  async buildDatabase(
    @Query('language') language: string = 'en',
    @Query('resolution') resolution: string = '300',
  ) {
    const resNum = parseInt(resolution, 10);
    return this.pictogramsService.buildDatabase(language, resNum);
  }

  @Post('clasifyCatTags')
  @ApiOperation({ summary: 'Use OpenAI to classify tags and categories into supercategories and supertags' })
  @ApiResponse({ status: 201, description: 'Classification completed successfully.' })
  async clasifyCatTags() {
    return this.pictogramsService.clasifyCatTags();
  }
}
