import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  AE_JOB_REPOSITORY,
  AE_USER_REPOSITORY,
  AE_APPLICATION_REPOSITORY,
  IAEJobRepository,
  IAEUserRepository,
  IAEApplicationRepository,
} from '../../domain/argentina-empleos/ae.repository.interface';
import {
  AEJob,
  AESourceType,
  AEJobStatus,
  AEModality,
  AEJobApplication,
} from '../../domain/argentina-empleos/entities';
import * as crypto from 'crypto';

export interface CreateJobInput {
  title: string;
  description: string;
  company: string;
  categoryId: string;
  categoryName: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  modality: AEModality;
  employmentType: any;
  workingDay?: string;
  requirements: string[];
  skills: string[];
  experienceLevel: string;
  educationLevel: string;
  salary?: string;
  contactInfo: string;
  isAnonymous?: boolean;
  sourceType?: AESourceType;
}

export interface ApplyJobInput {
  candidateId: string;
  message: string;
}

export interface JobFilterParams {
  provinceId?: string;
  cityId?: string;
  modality?: string;
  categoryId?: string;
  status?: string;
  sourceType?: string;
  creatorId?: string;
  query?: string;
  userProvinceId?: string;
  userCityId?: string;
}

export interface CategorizedFeed {
  nearYou: AEJob[];
  sameProvince: AEJob[];
  otherProvinces: AEJob[];
  remote: AEJob[];
  allRanked: AEJob[];
}

@Injectable()
export class AEJobService {
  constructor(
    @Inject(AE_JOB_REPOSITORY) private readonly jobRepo: IAEJobRepository,
    @Inject(AE_USER_REPOSITORY) private readonly userRepo: IAEUserRepository,
    @Inject(AE_APPLICATION_REPOSITORY)
    private readonly appRepo: IAEApplicationRepository,
  ) {}

  async createJob(
    creatorId: string,
    input: CreateJobInput,
    isSuperadmin = false,
  ): Promise<AEJob> {
    const creator = await this.userRepo.findById(creatorId);
    const now = new Date().toISOString();

    const job: AEJob = {
      id: `job_${crypto.randomBytes(6).toString('hex')}`,
      creatorId,
      creatorName: creator?.name || 'Publicador',
      creatorEmail: creator?.email || '',
      title: input.title,
      description: input.description,
      company: input.company,
      categoryId: input.categoryId,
      categoryName: input.categoryName,
      provinceId: input.provinceId,
      provinceName: input.provinceName,
      cityId: input.cityId,
      cityName: input.cityName,
      modality: input.modality,
      employmentType: input.employmentType,
      workingDay: input.workingDay,
      requirements: input.requirements || [],
      skills: input.skills || [],
      experienceLevel: input.experienceLevel,
      educationLevel: input.educationLevel,
      salary: input.salary,
      contactInfo: input.contactInfo,
      isAnonymous: Boolean(input.isAnonymous),
      sourceType: isSuperadmin ? input.sourceType || 'ADMIN_CREATED' : 'REAL',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.jobRepo.save(job);
    return job;
  }

  async getJobById(jobId: string, viewerUserId?: string): Promise<AEJob> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundException('Publicación no encontrada');
    }

    let isSuperadmin = false;
    let isOwner = false;

    if (viewerUserId) {
      const viewer = await this.userRepo.findById(viewerUserId);
      if (viewer?.role === 'superadmin') isSuperadmin = true;
      if (job.creatorId === viewerUserId) isOwner = true;
    }

    // Mask identity if anonymous and not viewer superadmin / owner
    if (job.isAnonymous && !isSuperadmin && !isOwner) {
      return {
        ...job,
        company: 'Publicación anónima',
        creatorName: 'Empresa confidencial',
        creatorEmail: 'Confidencial',
      };
    }

    return job;
  }

  async getFeedCategorized(params: JobFilterParams): Promise<CategorizedFeed> {
    const activeJobs = await this.jobRepo.findAll({
      status: 'active',
      provinceId: params.provinceId,
      cityId: params.cityId,
      modality: params.modality,
      categoryId: params.categoryId,
      query: params.query,
    });

    const userProvince = (params.userProvinceId || '').toLowerCase().trim();
    const userCity = (params.userCityId || '').toLowerCase().trim();

    const nearYou: AEJob[] = [];
    const sameProvince: AEJob[] = [];
    const otherProvinces: AEJob[] = [];
    const remote: AEJob[] = [];

    for (const rawJob of activeJobs) {
      const job = this.sanitizeJobForPublic(rawJob);

      if (job.modality === 'Remoto') {
        remote.push(job);
      }

      const jobProv = (job.provinceId || '').toLowerCase().trim();
      const jobCity = (job.cityId || '').toLowerCase().trim();

      if (userCity && jobCity === userCity) {
        nearYou.push(job);
      } else if (userProvince && jobProv === userProvince) {
        sameProvince.push(job);
      } else {
        otherProvinces.push(job);
      }
    }

    // Combine in 4-tier relevance order
    const allRanked = [
      ...nearYou,
      ...sameProvince,
      ...otherProvinces,
      ...remote.filter((r) => !nearYou.includes(r) && !sameProvince.includes(r)),
    ];

    return {
      nearYou,
      sameProvince,
      otherProvinces,
      remote,
      allRanked,
    };
  }

  async listUserJobs(userId: string): Promise<AEJob[]> {
    return await this.jobRepo.findAll({ creatorId: userId });
  }

  async updateJob(
    jobId: string,
    userId: string,
    partial: Partial<AEJob>,
    isSuperadmin = false,
  ): Promise<AEJob> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('Publicación no encontrada');
    if (job.creatorId !== userId && !isSuperadmin) {
      throw new Error('No autorizado para modificar este trabajo');
    }

    await this.jobRepo.update(jobId, partial);
    return (await this.jobRepo.findById(jobId))!;
  }

  async applyToJob(
    jobId: string,
    candidateId: string,
    message: string,
  ): Promise<AEJobApplication> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('La vacante a la que intentás postularte no existe');
    const candidate = await this.userRepo.findById(candidateId);
    if (!candidate) throw new NotFoundException('Candidato no encontrado');

    const now = new Date().toISOString();
    const application: AEJobApplication = {
      id: `app_${crypto.randomBytes(6).toString('hex')}`,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company,
      creatorId: job.creatorId,
      creatorEmail: job.creatorEmail || '',
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      candidateCityName: candidate.cityName,
      candidateProvinceName: candidate.provinceName,
      message: message.trim() || 'Estoy interesado/a en la posición.',
      status: 'pending',
      createdAt: now,
    };

    await this.appRepo.save(application);
    return application;
  }

  async getJobApplications(jobId: string, userId: string, isSuperadmin = false): Promise<AEJobApplication[]> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('Trabajo no encontrado');
    if (job.creatorId !== userId && !isSuperadmin) {
      throw new Error('No autorizado para ver las postulaciones de esta vacante');
    }
    return await this.appRepo.findByJobId(jobId);
  }

  async getCandidateApplications(candidateId: string): Promise<AEJobApplication[]> {
    return await this.appRepo.findByCandidateId(candidateId);
  }

  async deleteJob(jobId: string, userId: string, isSuperadmin = false): Promise<void> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('Publicación no encontrada');
    if (job.creatorId !== userId && !isSuperadmin) {
      throw new Error('No autorizado para eliminar este trabajo');
    }
    await this.jobRepo.delete(jobId);
  }

  private sanitizeJobForPublic(job: AEJob): AEJob {
    if (job.isAnonymous) {
      return {
        ...job,
        company: 'Publicación anónima',
        creatorName: 'Confidencial',
        creatorEmail: 'Confidencial',
      };
    }
    return job;
  }
}
