import { PartialType } from '@nestjs/swagger';
import { CreateKidDto } from './create-kid.dto.js';

export class UpdateKidDto extends PartialType(CreateKidDto) {}
