import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Pictogram extends Document {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  url: string;

  @Prop({ type: [Object], default: [] })
  keywords: any[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  categories: string[];
}

export const PictogramSchema = SchemaFactory.createForClass(Pictogram);
