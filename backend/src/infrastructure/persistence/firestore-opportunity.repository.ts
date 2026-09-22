import { Injectable } from '@nestjs/common';
import { FirestoreRepository } from './firestore-repository';
import {
  ICompany,
  ICompanyAnalysis,
  IJob,
  IJobAnalysis,
  IContact,
  IOpportunity,
  IApplication,
  IOutreach,
  IMessage,
  IProfile,
  ICv,
  IAIExecution,
} from '../../domain/opportunity/opportunity.entity';
import {
  ICompanyRepository,
  ICompanyAnalysisRepository,
  IJobRepository,
  IJobAnalysisRepository,
  IContactRepository,
  IOpportunityRepository,
  IApplicationRepository,
  IOutreachRepository,
  IMessageRepository,
  IProfileRepository,
  ICvRepository,
  IAIExecutionRepository,
} from '../../domain/opportunity/opportunity.repository.interface';

@Injectable()
export class FirestoreCompanyRepository extends FirestoreRepository<ICompany> implements ICompanyRepository {
  protected collectionName = 'companies';

  async findByDomain(domain: string): Promise<ICompany | null> {
    const list = await this.findByField('domain', domain);
    return list.length > 0 ? list[0] : null;
  }
}

@Injectable()
export class FirestoreCompanyAnalysisRepository extends FirestoreRepository<ICompanyAnalysis> implements ICompanyAnalysisRepository {
  protected collectionName = 'companyAnalyses';

  async findByCompanyId(companyId: string): Promise<ICompanyAnalysis[]> {
    return this.findByField('companyId', companyId);
  }

  async findByUserId(userId: string): Promise<ICompanyAnalysis[]> {
    return this.findByField('userId', userId);
  }
}

@Injectable()
export class FirestoreJobRepository extends FirestoreRepository<IJob> implements IJobRepository {
  protected collectionName = 'jobs';

  async findByUserId(userId: string): Promise<IJob[]> {
    return this.findByField('userId', userId);
  }

  async findByCompanyId(companyId: string): Promise<IJob[]> {
    return this.findByField('companyId', companyId);
  }
}

@Injectable()
export class FirestoreJobAnalysisRepository extends FirestoreRepository<IJobAnalysis> implements IJobAnalysisRepository {
  protected collectionName = 'jobAnalyses';

  async findByJobId(jobId: string): Promise<IJobAnalysis | null> {
    const list = await this.findByField('jobId', jobId);
    return list.length > 0 ? list[0] : null;
  }
}

@Injectable()
export class FirestoreContactRepository extends FirestoreRepository<IContact> implements IContactRepository {
  protected collectionName = 'contacts';

  async findByUserId(userId: string): Promise<IContact[]> {
    return this.findByField('userId', userId);
  }

  async findByCompanyId(companyId: string): Promise<IContact[]> {
    return this.findByField('companyId', companyId);
  }
}

@Injectable()
export class FirestoreOpportunityRepository extends FirestoreRepository<IOpportunity> implements IOpportunityRepository {
  protected collectionName = 'opportunities';

  async findByUserId(userId: string): Promise<IOpportunity[]> {
    return this.findByField('userId', userId);
  }

  async findByType(userId: string, type: 'job' | 'client'): Promise<IOpportunity[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('type', '==', type)
      .get();
    return snapshot.docs.map((doc) => this.toEntity({ id: doc.id, ...doc.data() }));
  }
}

@Injectable()
export class FirestoreApplicationRepository extends FirestoreRepository<IApplication> implements IApplicationRepository {
  protected collectionName = 'applications';

  async findByUserId(userId: string): Promise<IApplication[]> {
    return this.findByField('userId', userId);
  }
}

@Injectable()
export class FirestoreOutreachRepository extends FirestoreRepository<IOutreach> implements IOutreachRepository {
  protected collectionName = 'outreach';

  async findByUserId(userId: string): Promise<IOutreach[]> {
    return this.findByField('userId', userId);
  }
}

@Injectable()
export class FirestoreMessageRepository extends FirestoreRepository<IMessage> implements IMessageRepository {
  protected collectionName = 'messages';

  async findByUserId(userId: string): Promise<IMessage[]> {
    return this.findByField('userId', userId);
  }
}

@Injectable()
export class FirestoreProfileRepository extends FirestoreRepository<IProfile> implements IProfileRepository {
  protected collectionName = 'profiles';
}

@Injectable()
export class FirestoreCvRepository extends FirestoreRepository<ICv> implements ICvRepository {
  protected collectionName = 'cvs';

  async findByUserId(userId: string): Promise<ICv[]> {
    return this.findByField('userId', userId);
  }

  async findDefaultByUserId(userId: string): Promise<ICv | null> {
    const list = await this.collection
      .where('userId', '==', userId)
      .where('isDefault', '==', true)
      .limit(1)
      .get();
    return list.empty ? null : this.toEntity({ id: list.docs[0].id, ...list.docs[0].data() });
  }
}

@Injectable()
export class FirestoreAIExecutionRepository extends FirestoreRepository<IAIExecution> implements IAIExecutionRepository {
  protected collectionName = 'aiExecutions';

  async findByUserId(userId: string): Promise<IAIExecution[]> {
    return this.findByField('userId', userId);
  }
}
