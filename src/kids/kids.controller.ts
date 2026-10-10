import { Controller, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { KidsService } from './kids.service.js';
import { CreateKidDto } from './dto/create-kid.dto.js';
import { UpdateKidDto } from './dto/update-kid.dto.js';

@ApiTags('kids')
@Controller('kids')
export class KidsController {
  constructor(private readonly kidsService: KidsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new kid profile' })
  @ApiResponse({ status: 201, description: 'The kid profile has been successfully created.' })
  async create(@Body() createKidDto: CreateKidDto) {
    return this.kidsService.create(createKidDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing kid profile' })
  @ApiParam({ name: 'id', description: 'The kid ID' })
  @ApiResponse({ status: 200, description: 'The kid profile has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Kid not found.' })
  async update(@Param('id') id: string, @Body() updateKidDto: UpdateKidDto) {
    return this.kidsService.update(id, updateKidDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a kid profile' })
  @ApiParam({ name: 'id', description: 'The kid ID' })
  @ApiResponse({ status: 200, description: 'The kid profile has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Kid not found.' })
  async remove(@Param('id') id: string) {
    return this.kidsService.remove(id);
  }
}
