import { Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import {
  AEUser,
  AEJob,
  AEWallet,
  AEWalletTransaction,
  AEWithdrawal,
  AEAdminLog,
  AECategory,
  AEJobApplication,
} from '../../domain/argentina-empleos/entities';
import {
  IAEUserRepository,
  IAEJobRepository,
  IAEWalletRepository,
  IAETransactionRepository,
  IAEWithdrawalRepository,
  IAEAdminLogRepository,
  IAECategoryRepository,
  IAEApplicationRepository,
} from '../../domain/argentina-empleos/ae.repository.interface';
import { DEFAULT_JOB_CATEGORIES } from './argentina-geo.data';

@Injectable()
export class FirestoreAEUserRepository implements IAEUserRepository {
  private collectionName = 'ae_users';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  async findById(id: string): Promise<AEUser | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as AEUser;
  }

  async findByEmail(email: string): Promise<AEUser | null> {
    const snap = await this.collection.where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as AEUser;
  }

  async findAll(): Promise<AEUser[]> {
    const snap = await this.collection.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEUser));
  }

  async save(user: AEUser): Promise<void> {
    await this.collection.doc(user.id).set({ ...user });
  }

  async update(id: string, partial: Partial<AEUser>): Promise<void> {
    await this.collection.doc(id).set(
      {
        ...partial,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async setBlockStatus(id: string, isBlocked: boolean): Promise<void> {
    await this.collection.doc(id).update({
      isBlocked,
      updatedAt: new Date().toISOString(),
    });
  }
}

@Injectable()
export class FirestoreAEJobRepository implements IAEJobRepository {
  private collectionName = 'ae_jobs';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  async findById(id: string): Promise<AEJob | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as AEJob;
  }

  async findAll(filters?: {
    provinceId?: string;
    cityId?: string;
    modality?: string;
    categoryId?: string;
    status?: string;
    sourceType?: string;
    creatorId?: string;
    query?: string;
  }): Promise<AEJob[]> {
    let q: FirebaseFirestore.Query = this.collection;

    if (filters?.status) {
      q = q.where('status', '==', filters.status);
    }
    if (filters?.creatorId) {
      q = q.where('creatorId', '==', filters.creatorId);
    }
    if (filters?.sourceType) {
      q = q.where('sourceType', '==', filters.sourceType);
    }
    if (filters?.provinceId) {
      q = q.where('provinceId', '==', filters.provinceId);
    }
    if (filters?.cityId) {
      q = q.where('cityId', '==', filters.cityId);
    }
    if (filters?.modality) {
      q = q.where('modality', '==', filters.modality);
    }
    if (filters?.categoryId) {
      q = q.where('categoryId', '==', filters.categoryId);
    }

    const snap = await q.get();
    let jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEJob));

    if (filters?.query) {
      const qLower = filters.query.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(qLower) ||
          j.description.toLowerCase().includes(qLower) ||
          j.company.toLowerCase().includes(qLower) ||
          j.requirements?.some((r) => r.toLowerCase().includes(qLower)) ||
          j.skills?.some((s) => s.toLowerCase().includes(qLower)),
      );
    }

    // Sort by createdAt desc
    jobs.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );

    return jobs;
  }

  async save(job: AEJob): Promise<void> {
    await this.collection.doc(job.id).set({ ...job });
  }

  async update(id: string, partial: Partial<AEJob>): Promise<void> {
    await this.collection.doc(id).set(
      {
        ...partial,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}

@Injectable()
export class FirestoreAEWalletRepository implements IAEWalletRepository {
  private collectionName = 'ae_wallets';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  async findById(userId: string): Promise<AEWallet | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as AEWallet;
  }

  async findAll(): Promise<AEWallet[]> {
    const snap = await this.collection.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEWallet));
  }

  async save(wallet: AEWallet): Promise<void> {
    await this.collection.doc(wallet.userId).set({ ...wallet });
  }

  async updateCredits(
    userId: string,
    deltaCredits: number,
    deltaRealMoney = 0,
  ): Promise<AEWallet> {
    const docRef = this.collection.doc(userId);
    const db = getFirestore();

    return await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) {
        throw new Error('Wallet not found');
      }
      const data = doc.data() as AEWallet;
      const updatedCredits = Math.max(0, (data.internalCredits || 0) + deltaCredits);
      const updatedRealMoney = Math.max(0, (data.realMoney || 0) + deltaRealMoney);
      const now = new Date().toISOString();

      const updated: AEWallet = {
        ...data,
        internalCredits: updatedCredits,
        realMoney: updatedRealMoney,
        updatedAt: now,
      };

      t.update(docRef, {
        internalCredits: updatedCredits,
        realMoney: updatedRealMoney,
        updatedAt: now,
      });

      return updated;
    });
  }
}

@Injectable()
export class FirestoreAETransactionRepository implements IAETransactionRepository {
  private collectionName = 'ae_wallet_transactions';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  async findById(id: string): Promise<AEWalletTransaction | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as AEWalletTransaction;
  }

  async findByUserId(userId: string): Promise<AEWalletTransaction[]> {
    const snap = await this.collection.where('userId', '==', userId).get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEWalletTransaction));
    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    return list;
  }

  async findAll(): Promise<AEWalletTransaction[]> {
    const snap = await this.collection.get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEWalletTransaction));
    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    return list;
  }

  async save(transaction: AEWalletTransaction): Promise<void> {
    await this.collection.doc(transaction.id).set({ ...transaction });
  }
}

@Injectable()
export class FirestoreAEWithdrawalRepository implements IAEWithdrawalRepository {
  private collectionName = 'ae_withdrawals';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  async findById(id: string): Promise<AEWithdrawal | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as AEWithdrawal;
  }

  async findByUserId(userId: string): Promise<AEWithdrawal[]> {
    const snap = await this.collection.where('userId', '==', userId).get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEWithdrawal));
    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    return list;
  }

  async findAll(): Promise<AEWithdrawal[]> {
    const snap = await this.collection.get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEWithdrawal));
    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    return list;
  }

  async save(withdrawal: AEWithdrawal): Promise<void> {
    await this.collection.doc(withdrawal.id).set({ ...withdrawal });
  }

  async updateStatus(
    id: string,
    status: string,
    adminNotes?: string,
    reviewedByAdminId?: string,
  ): Promise<void> {
    await this.collection.doc(id).update({
      status,
      ...(adminNotes ? { adminNotes } : {}),
      ...(reviewedByAdminId ? { reviewedByAdminId } : {}),
      updatedAt: new Date().toISOString(),
    });
  }
}

@Injectable()
export class FirestoreAEAdminLogRepository implements IAEAdminLogRepository {
  private collectionName = 'ae_admin_logs';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  async findAll(): Promise<AEAdminLog[]> {
    const snap = await this.collection.get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEAdminLog));
    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    return list;
  }

  async save(log: AEAdminLog): Promise<void> {
    await this.collection.doc(log.id).set({ ...log });
  }
}

@Injectable()
export class FirestoreAECategoryRepository implements IAECategoryRepository {
  private collectionName = 'ae_categories';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  async findAll(): Promise<AECategory[]> {
    const snap = await this.collection.get();
    if (snap.empty) {
      // Seed default categories
      return DEFAULT_JOB_CATEGORIES;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AECategory));
  }

  async save(category: AECategory): Promise<void> {
    await this.collection.doc(category.id).set({ ...category });
  }
}

@Injectable()
export class FirestoreAEApplicationRepository implements IAEApplicationRepository {
  private collectionName = 'ae_applications';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  async findById(id: string): Promise<AEJobApplication | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as AEJobApplication;
  }

  async findByJobId(jobId: string): Promise<AEJobApplication[]> {
    const snap = await this.collection.where('jobId', '==', jobId).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEJobApplication));
  }

  async findByCandidateId(candidateId: string): Promise<AEJobApplication[]> {
    const snap = await this.collection.where('candidateId', '==', candidateId).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEJobApplication));
  }

  async findByCreatorId(creatorId: string): Promise<AEJobApplication[]> {
    const snap = await this.collection.where('creatorId', '==', creatorId).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AEJobApplication));
  }

  async save(application: AEJobApplication): Promise<void> {
    await this.collection.doc(application.id).set({ ...application });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.collection.doc(id).set({ status }, { merge: true });
  }
}
