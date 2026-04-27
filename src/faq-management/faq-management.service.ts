import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFaqManagementDto } from './dto/create-faq-management.dto';
import { UpdateFaqManagementDto } from './dto/update-faq-management.dto';
import { FaqManagement, FaqManagementDocument } from './schemas/faq-management.schema';

export const FAQ_CACHE_KEY = '/faq';

@Injectable()
export class FaqManagementService {
  constructor(
    @InjectModel(FaqManagement.name)
    private readonly faqModel: Model<FaqManagementDocument>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll() {
    return this.faqModel.find({ isActive: true }).sort({ order: 1 }).exec();
  }

  async findOne(id: string) {
    const item = await this.faqModel.findOne({ _id: id, isActive: true }).exec();
    if (!item) {
      throw new NotFoundException('FaqManagement item not found');
    }
    return item;
  }

  async create(payload: CreateFaqManagementDto) {
    const created = new this.faqModel(payload);
    await created.save();
    await this.cache.del(FAQ_CACHE_KEY);
    return created;
  }

  async update(id: string, payload: UpdateFaqManagementDto) {
    const updated = await this.faqModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    
    if (!updated) {
      throw new NotFoundException('FaqManagement item not found');
    }
    
    await this.cache.del(FAQ_CACHE_KEY);
    await this.cache.del(`${FAQ_CACHE_KEY}/${id}`);
    return updated;
  }

  async remove(id: string) {
    const result = await this.faqModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('FaqManagement item not found');
    }
    
    await this.cache.del(FAQ_CACHE_KEY);
    await this.cache.del(`${FAQ_CACHE_KEY}/${id}`);
    return { id, deleted: true };
  }
}
