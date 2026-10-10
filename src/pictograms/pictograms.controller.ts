import { Controller, Post, Query, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
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

  @Get('supercategories')
  @ApiOperation({ summary: 'Get all supercategories' })
  @ApiResponse({ status: 200, description: 'List of all supercategories.' })
  async getSupercategories() {
    return this.pictogramsService.getSupercategories();
  }

  @Get('supercategories/:id/categories')
  @ApiOperation({ summary: 'Get categories for a determined supercategory by id' })
  @ApiParam({ name: 'id', description: 'The supercategory ID' })
  @ApiResponse({ status: 200, description: 'Categories belonging to the supercategory.' })
  @ApiResponse({ status: 404, description: 'Supercategory not found.' })
  async getSupercategoryCategories(@Param('id') id: string) {
    return this.pictogramsService.getSupercategoryCategories(id);
  }

  @Get('supertags')
  @ApiOperation({ summary: 'Get all supertags' })
  @ApiResponse({ status: 200, description: 'List of all supertags.' })
  async getSupertags() {
    return this.pictogramsService.getSupertags();
  }

  @Get('supertags/:id/tags')
  @ApiOperation({ summary: 'Get tags for a determined supertag by id' })
  @ApiParam({ name: 'id', description: 'The supertag ID' })
  @ApiResponse({ status: 200, description: 'Tags belonging to the supertag.' })
  @ApiResponse({ status: 404, description: 'Supertag not found.' })
  async getSupertagTags(@Param('id') id: string) {
    return this.pictogramsService.getSupertagTags(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get pictograms filtered by category and/or tag' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category name' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag name' })
  @ApiResponse({ status: 200, description: 'List of matching pictograms.' })
  async getPictograms(
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return this.pictogramsService.getPictograms(category, tag);
  }
}
