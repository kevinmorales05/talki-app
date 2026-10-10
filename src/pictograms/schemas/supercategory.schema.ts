import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Supercategory extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [Object], default: [] })
  categories: { id: string; name: string }[];
}

export const SupercategorySchema = SchemaFactory.createForClass(Supercategory);
