import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Supertag extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [Object], default: [] })
  tags: { id: string; name: string }[];
}

export const SupertagSchema = SchemaFactory.createForClass(Supertag);
