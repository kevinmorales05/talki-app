import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pictogram } from './schemas/pictogram.schema.js';
import { Tag } from './schemas/tag.schema.js';
import { Category } from './schemas/category.schema.js';
import { Supercategory } from './schemas/supercategory.schema.js';
import { Supertag } from './schemas/supertag.schema.js';
import { OpenaiService } from '../openai/openai.service.js';

@Injectable()
export class PictogramsService {
  private readonly logger = new Logger(PictogramsService.name);

  constructor(
    @InjectModel(Pictogram.name) private pictogramModel: Model<Pictogram>,
    @InjectModel(Tag.name) private tagModel: Model<Tag>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Supercategory.name) private supercategoryModel: Model<Supercategory>,
    @InjectModel(Supertag.name) private supertagModel: Model<Supertag>,
    private readonly openaiService: OpenaiService,
  ) {}

  async buildDatabase(language: string = 'en', resolution: number = 300) {
    const validResolutions = [300, 500, 2500];
    if (!validResolutions.includes(resolution)) {
      throw new HttpException('Invalid resolution. Must be 300, 500, or 2500.', HttpStatus.BAD_REQUEST);
    }

    const endpoint = `https://api.arasaac.org/v1/pictograms/all/${language}`;
    this.logger.log(`Fetching pictograms from ${endpoint}...`);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch pictograms: ${response.statusText}`);
      }

      const data: any[] = await response.json();
      this.logger.log(`Received ${data.length} pictograms. Processing...`);

      const tagsSet = new Set<string>();
      const categoriesSet = new Set<string>();

      const pictogramsToInsert = data.map((item) => {
        if (item.tags) {
          item.tags.forEach((t: string) => tagsSet.add(t));
        }
        if (item.categories) {
          item.categories.forEach((c: string) => categoriesSet.add(c));
        }

        return {
          id: item._id,
          url: `https://static.arasaac.org/pictograms/${item._id}/${item._id}_${resolution}.png`,
          keywords: item.keywords || [],
          tags: item.tags || [],
          categories: item.categories || [],
        };
      });

      // Clear existing records
      this.logger.log('Clearing old records...');
      await this.pictogramModel.deleteMany({});
      await this.tagModel.deleteMany({});
      await this.categoryModel.deleteMany({});

      // Insert new records
      this.logger.log('Inserting pictograms...');
      await this.pictogramModel.insertMany(pictogramsToInsert);

      this.logger.log('Inserting tags...');
      const tagsToInsert = Array.from(tagsSet).map((name) => ({ name }));
      await this.tagModel.insertMany(tagsToInsert);

      this.logger.log('Inserting categories...');
      const categoriesToInsert = Array.from(categoriesSet).map((name) => ({ name }));
      await this.categoryModel.insertMany(categoriesToInsert);

      this.logger.log(`Finished building database. Total Categories: ${categoriesSet.size}, Total Tags: ${tagsSet.size}`);

      return {
        message: 'Internal database built successfully',
        totalPictograms: pictogramsToInsert.length,
        totalTags: tagsSet.size,
        totalCategories: categoriesSet.size,
      };
    } catch (error) {
      this.logger.error('Error building database', error);
      throw new HttpException('Error building database', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async clasifyCatTags() {
    this.logger.log('Starting classification of categories and tags...');
    try {
      const categories = await this.categoryModel.find().exec();
      const tags = await this.tagModel.find().exec();

      if (!categories.length && !tags.length) {
        throw new HttpException('No categories or tags found in the database. Please build the database first.', HttpStatus.BAD_REQUEST);
      }

      const categoriesData = categories.map((c) => ({ id: c._id.toString(), name: c.name }));
      const tagsData = tags.map((t) => ({ id: t._id.toString(), name: t.name }));

      let supercategories = [];
      if (categoriesData.length > 0) {
        this.logger.log(`Classifying ${categoriesData.length} categories...`);
        const catPrompt = `You are a data classification assistant. Group the following list of categories into a smaller number of broader supercategories. Return ONLY a valid JSON array of objects, where each object has a "name" (the supercategory name) and a "categories" array. Each item in the "categories" array must be an object with "id" and "name" exactly as provided. Do not include markdown code blocks.\n\nCategories:\n${JSON.stringify(categoriesData)}`;

        const catResponse = await this.openaiService.generateText(catPrompt);
        const cleanCatRes = catResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        supercategories = JSON.parse(cleanCatRes);

        await this.supercategoryModel.deleteMany({});
        await this.supercategoryModel.insertMany(supercategories);
        this.logger.log(`Successfully saved ${supercategories.length} supercategories.`);
      }

      let supertags = [];
      if (tagsData.length > 0) {
        this.logger.log(`Classifying ${tagsData.length} tags...`);
        const tagPrompt = `You are a data classification assistant. Group the following list of tags into a smaller number of broader supertags. Return ONLY a valid JSON array of objects, where each object has a "name" (the supertag name) and a "tags" array. Each item in the "tags" array must be an object with "id" and "name" exactly as provided. Do not include markdown code blocks.\n\nTags:\n${JSON.stringify(tagsData)}`;

        const tagResponse = await this.openaiService.generateText(tagPrompt);
        const cleanTagRes = tagResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        supertags = JSON.parse(cleanTagRes);

        await this.supertagModel.deleteMany({});
        await this.supertagModel.insertMany(supertags);
        this.logger.log(`Successfully saved ${supertags.length} supertags.`);
      }

      return {
        message: 'Classification completed successfully',
        supercategoriesCount: supercategories.length,
        supertagsCount: supertags.length,
      };
    } catch (error) {
      this.logger.error('Error classifying categories and tags', error);
      throw new HttpException('Error classifying categories and tags', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSupercategories() {
    return this.supercategoryModel.find().exec();
  }

  async getSupercategoryCategories(id: string) {
    const supercategory = await this.supercategoryModel.findById(id).exec();
    if (!supercategory) {
      throw new HttpException('Supercategory not found', HttpStatus.NOT_FOUND);
    }
    return supercategory.categories;
  }

  async getSupertags() {
    return this.supertagModel.find().exec();
  }

  async getSupertagTags(id: string) {
    const supertag = await this.supertagModel.findById(id).exec();
    if (!supertag) {
      throw new HttpException('Supertag not found', HttpStatus.NOT_FOUND);
    }
    return supertag.tags;
  }

  async getPictograms(category?: string, tag?: string) {
    const query: any = {};
    if (category) {
      query.categories = category;
    }
    if (tag) {
      query.tags = tag;
    }
    return this.pictogramModel.find(query).exec();
  }

  async findPictogramsByTagsAndCategories(categories: string[], tags: string[]) {
    const query: any = {};
    if (categories && categories.length > 0) {
      query.categories = { $in: categories };
    }
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
    return this.pictogramModel.find(query).exec();
  }
}
