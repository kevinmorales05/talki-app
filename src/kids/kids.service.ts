import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Kid, KidDocument } from './schemas/kid.schema.js';
import { CreateKidDto } from './dto/create-kid.dto.js';
import { UpdateKidDto } from './dto/update-kid.dto.js';

@Injectable()
export class KidsService {
  constructor(@InjectModel(Kid.name) private kidModel: Model<KidDocument>) {}

  async create(createKidDto: CreateKidDto): Promise<Kid> {
    const createdKid = new this.kidModel(createKidDto);
    return createdKid.save();
  }

  async update(id: string, updateKidDto: UpdateKidDto): Promise<Kid> {
    const existingKid = await this.kidModel.findByIdAndUpdate(id, updateKidDto, { new: true }).exec();
    if (!existingKid) {
      throw new NotFoundException(`Kid #${id} not found`);
    }
    return existingKid;
  }

  async remove(id: string): Promise<Kid> {
    const deletedKid = await this.kidModel.findByIdAndDelete(id).exec();
    if (!deletedKid) {
      throw new NotFoundException(`Kid #${id} not found`);
    }
    return deletedKid;
  }

  async findByUserId(userId: string): Promise<Kid[]> {
    return this.kidModel.find({ user_id: userId }).exec();
  }
}
