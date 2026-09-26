import { Injectable, Logger } from '@nestjs/common';
import { FirestoreRepository } from './firestore-repository';
import {
  IBusinessProfile,
  IBusinessOpportunity,
  BusinessOpportunityStatus,
} from '../../domain/business/business.entity';
import {
  IBusinessProfileRepository,
  IBusinessOpportunityRepository,
} from '../../domain/business/business.repository.interface';

@Injectable()
export class FirestoreBusinessProfileRepository
  extends FirestoreRepository<IBusinessProfile>
  implements IBusinessProfileRepository
{
  protected collectionName = 'businessProfiles';
  private readonly logger = new Logger(FirestoreBusinessProfileRepository.name);
  private memoryProfiles: Map<string, IBusinessProfile> = new Map();

  async findByUserId(userId: string): Promise<IBusinessProfile | null> {
    try {
      if (this.collection) {
        const list = await this.findByField('userId', userId);
        if (list.length > 0) return list[0];
      }
    } catch (err) {
      this.logger.warn(`Firestore unavailable, checking in-memory cache: ${err}`);
    }
    return this.memoryProfiles.get(userId) || null;
  }

  async save(profile: IBusinessProfile): Promise<void> {
    this.memoryProfiles.set(profile.userId, profile);
    try {
      if (this.collection) {
        await super.save(profile);
      }
    } catch (err) {
      this.logger.warn(`Firestore save failed, saved in-memory: ${err}`);
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.memoryProfiles.delete(userId);
    try {
      if (this.collection) {
        const list = await this.findByField('userId', userId);
        for (const item of list) {
          await this.delete(item.id);
        }
      }
    } catch (err) {
      this.logger.warn(`Firestore delete failed: ${err}`);
    }
  }
}

@Injectable()
export class FirestoreBusinessOpportunityRepository
  extends FirestoreRepository<IBusinessOpportunity>
  implements IBusinessOpportunityRepository
{
  protected collectionName = 'businessOpportunities';
  private readonly logger = new Logger(FirestoreBusinessOpportunityRepository.name);
  private memoryOpportunities: Map<string, IBusinessOpportunity> = new Map();

  async findByUserId(userId: string): Promise<IBusinessOpportunity[]> {
    try {
      if (this.collection) {
        const list = await this.findByField('userId', userId);
        if (list.length > 0) return list;
      }
    } catch (err) {
      this.logger.warn(`Firestore unavailable, reading opportunities in-memory: ${err}`);
    }
    return Array.from(this.memoryOpportunities.values()).filter((o) => o.userId === userId);
  }

  async findByBusinessId(businessId: string): Promise<IBusinessOpportunity[]> {
    try {
      if (this.collection) {
        const list = await this.findByField('businessId', businessId);
        if (list.length > 0) return list;
      }
    } catch (err) {
      this.logger.warn(`Firestore unavailable, reading opportunities in-memory: ${err}`);
    }
    return Array.from(this.memoryOpportunities.values()).filter((o) => o.businessId === businessId);
  }

  async findById(id: string): Promise<IBusinessOpportunity | null> {
    try {
      if (this.collection) {
        const item = await super.findById(id);
        if (item) return item;
      }
    } catch (err) {
      this.logger.warn(`Firestore findById failed: ${err}`);
    }
    return this.memoryOpportunities.get(id) || null;
  }

  async save(opportunity: IBusinessOpportunity): Promise<void> {
    this.memoryOpportunities.set(opportunity.id, opportunity);
    try {
      if (this.collection) {
        await super.save(opportunity);
      }
    } catch (err) {
      this.logger.warn(`Firestore save opportunity failed, stored in-memory: ${err}`);
    }
  }

  async saveMany(opportunities: IBusinessOpportunity[]): Promise<void> {
    for (const opp of opportunities) {
      await this.save(opp);
    }
  }

  async updateStatus(id: string, status: BusinessOpportunityStatus): Promise<IBusinessOpportunity | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: IBusinessOpportunity = {
      ...existing,
      status,
      updatedAt: new Date(),
    };
    await this.save(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.memoryOpportunities.delete(id);
    try {
      if (this.collection) {
        await super.delete(id);
      }
    } catch (err) {
      this.logger.warn(`Firestore delete opportunity failed: ${err}`);
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, opp] of this.memoryOpportunities.entries()) {
      if (opp.userId === userId) {
        this.memoryOpportunities.delete(id);
      }
    }
    try {
      if (this.collection) {
        const list = await this.findByField('userId', userId);
        for (const item of list) {
          await this.delete(item.id);
        }
      }
    } catch (err) {
      this.logger.warn(`Firestore deleteByUserId failed: ${err}`);
    }
  }
}
