import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PictogramsController } from './pictograms.controller.js';
import { PictogramsService } from './pictograms.service.js';
import { Pictogram, PictogramSchema } from './schemas/pictogram.schema.js';
import { Tag, TagSchema } from './schemas/tag.schema.js';
import { Category, CategorySchema } from './schemas/category.schema.js';
import { Supercategory, SupercategorySchema } from './schemas/supercategory.schema.js';
import { Supertag, SupertagSchema } from './schemas/supertag.schema.js';
import { OpenaiModule } from '../openai/openai.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pictogram.name, schema: PictogramSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Supercategory.name, schema: SupercategorySchema },
      { name: Supertag.name, schema: SupertagSchema },
    ]),
    OpenaiModule,
  ],
  controllers: [PictogramsController],
  providers: [PictogramsService],
})
export class PictogramsModule {}
