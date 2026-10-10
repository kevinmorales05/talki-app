import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SavedPhrase, SavedPhraseDocument } from './schemas/saved-phrase.schema.js';
import { CreateSavedPhraseDto } from './dto/create-saved-phrase.dto.js';

@Injectable()
export class SavedPhrasesService {
  constructor(
    @InjectModel(SavedPhrase.name) private savedPhraseModel: Model<SavedPhraseDocument>,
  ) {}

  async create(createSavedPhraseDto: CreateSavedPhraseDto): Promise<SavedPhrase> {
    const createdSavedPhrase = new this.savedPhraseModel(createSavedPhraseDto);
    return createdSavedPhrase.save();
  }

  async findByUserAndKid(userId: string, kidId: string): Promise<SavedPhrase[]> {
    return this.savedPhraseModel.find({ user_id: userId, kid_id: kidId }).exec();
  }
}
