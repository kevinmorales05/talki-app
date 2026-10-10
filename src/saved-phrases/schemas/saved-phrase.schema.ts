import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SavedPhraseDocument = SavedPhrase & Document;

@Schema({ timestamps: true })
export class SavedPhrase {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  kid_id: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  phrase: any[];

  @Prop()
  topic: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  examples: any[];
}

export const SavedPhraseSchema = SchemaFactory.createForClass(SavedPhrase);
