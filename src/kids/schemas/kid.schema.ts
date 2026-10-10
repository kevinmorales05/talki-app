import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KidDocument = Kid & Document;

@Schema()
export class Kid {
  @Prop({ required: false })
  name?: string;

  @Prop({ required: false })
  lastname?: string;

  @Prop({ required: false })
  birthday?: Date;

  @Prop({ required: true, unique: true })
  user_id: string;

  @Prop({ required: false, enum: ['down_syndrome', 'autism', 'speech', 'none'] })
  specialNeed?: string;
}

export const KidSchema = SchemaFactory.createForClass(Kid);
