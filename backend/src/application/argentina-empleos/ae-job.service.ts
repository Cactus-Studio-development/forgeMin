import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AE_JOB_REPOSITORY,
  AE_USER_REPOSITORY,
  AE_APPLICATION_REPOSITORY,
  AE_NOTIFICATION_REPOSITORY,
  AE_MESSAGE_REPOSITORY,
  IAEJobRepository,
  IAEUserRepository,
  IAEApplicationRepository,
  IAENotificationRepository,
  IAEMessageRepository,
} from '../../domain/argentina-empleos/ae.repository.interface';
import {
  AEJob,
  AESourceType,
  AEJobStatus,
  AEModality,
  AEJobApplication,
  AENotification,
  AEMessage,
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
  isPrivate?: boolean;
  isVerifiedCompany?: boolean;
  isWomenOnly?: boolean;
  hasTermsAgreement?: boolean;
  termsText?: string;
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
  viewerUserId?: string;
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
    @Inject(AE_NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: IAENotificationRepository,
    @Inject(AE_MESSAGE_REPOSITORY)
    private readonly messageRepo: IAEMessageRepository,
  ) {}

  async createJob(
    creatorId: string,
    input: CreateJobInput,
  ): Promise<AEJob> {
    const creator = await this.userRepo.findById(creatorId);
    const isSuperadmin = creator?.role === 'superadmin';
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
      isPrivate: Boolean(input.isPrivate),
      isVerifiedCompany: isSuperadmin ? Boolean(input.isVerifiedCompany) : false,
      isWomenOnly: isSuperadmin ? Boolean(input.isWomenOnly) : false,
      hasTermsAgreement: isSuperadmin ? Boolean(input.hasTermsAgreement) : false,
      termsText: isSuperadmin && input.hasTermsAgreement ? (input.termsText || '') : '',
      acceptedTermsUserIds: [],
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
    let hasAcceptedTerms = false;
    let viewerGender: string | undefined = undefined;

    if (viewerUserId) {
      const viewer = await this.userRepo.findById(viewerUserId);
      if (viewer) {
        if (viewer.role === 'superadmin') isSuperadmin = true;
        if (job.creatorId === viewerUserId) isOwner = true;
        if (job.acceptedTermsUserIds && job.acceptedTermsUserIds.includes(viewerUserId)) {
          hasAcceptedTerms = true;
        }
        viewerGender = viewer.gender;
      }
    }

    // Exclude women-only job from non-female viewers (unless superadmin or owner)
    if (job.isWomenOnly && !isSuperadmin && !isOwner && viewerGender !== 'Femenino') {
      throw new ForbiddenException('Esta publicación está reservada exclusivamente para postulantes de género femenino.');
    }

    // Mask identity if anonymous and not viewer superadmin / owner
    let processedJob = { ...job };
    if (job.isAnonymous && !isSuperadmin && !isOwner) {
      processedJob = {
        ...processedJob,
        company: 'Publicación anónima',
        creatorName: 'Empresa confidencial',
        creatorEmail: 'Confidencial',
      };
    }

    // If job has special terms agreement and viewer hasn't accepted, mask details
    if (job.hasTermsAgreement && !isSuperadmin && !isOwner && !hasAcceptedTerms) {
      return {
        ...processedJob,
        description: 'Debes aceptar los términos y condiciones de confidencialidad de esta publicación especial para acceder a la descripción completa y requisitos.',
        requirements: ['Aceptación obligatoria de términos de confidencialidad y acuerdos de contratación.'],
        skills: [],
        salary: 'Confidencial hasta aceptar términos',
        contactInfo: 'Protegida por acuerdo',
      };
    }

    return processedJob;
  }

  async acceptJobTerms(jobId: string, userId: string): Promise<AEJob> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('Publicación no encontrada');

    const acceptedList = job.acceptedTermsUserIds || [];
    if (!acceptedList.includes(userId)) {
      acceptedList.push(userId);
      await this.jobRepo.update(jobId, { acceptedTermsUserIds: acceptedList });
      job.acceptedTermsUserIds = acceptedList;
    }

    return job;
  }

  async inviteCandidateToJob(
    superadminId: string,
    jobId: string,
    candidateId: string,
    customMessage?: string,
  ): Promise<{ success: boolean; message: string }> {
    const admin = await this.userRepo.findById(superadminId);
    if (!admin || admin.role !== 'superadmin') {
      throw new UnauthorizedException('Solo el superadministrador puede enviar invitaciones a postularse');
    }

    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('Publicación de empleo no encontrada');

    const candidate = await this.userRepo.findById(candidateId);
    if (!candidate) throw new NotFoundException('Candidato no encontrado');

    const now = new Date().toISOString();

    // 1. Create Notification
    const notif: AENotification = {
      id: `notif_${crypto.randomBytes(6).toString('hex')}`,
      userId: candidateId,
      type: 'APPLICATION',
      title: 'Invitación a Postularte',
      message: `El administrador consideró tu perfil ideal para la vacante "${job.title}" en ${job.company}.`,
      link: `/argentinaEmpleos/trabajos/detalle?id=${job.id}`,
      read: false,
      createdAt: now,
    };
    await this.notificationRepo.save(notif);

    // 2. Send Message from Admin
    const msgContent = `Hola ${candidate.name}, revisamos tu perfil en Argentina Empleos y consideramos que tienes una excelente coincidencia para la búsqueda de "${job.title}" (${job.company}). ${customMessage ? `\n\nNota: ${customMessage}` : ''}\n\nTe invitamos a ver los detalles y postularte aquí: /argentinaEmpleos/trabajos/detalle?id=${job.id}`;
    
    const msg: AEMessage = {
      id: `msg_${crypto.randomBytes(6).toString('hex')}`,
      senderId: superadminId,
      senderName: admin.name || 'Administración de Empleos',
      senderEmail: admin.email || 'admin@argentinaempleos.com',
      receiverId: candidateId,
      receiverName: candidate.name,
      receiverEmail: candidate.email,
      subject: `Invitación a Postulación: ${job.title}`,
      content: msgContent,
      read: false,
      createdAt: now,
    };
    await this.messageRepo.save(msg);

    return { success: true, message: 'Invitación enviada con éxito al postulante' };
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

    let isSuperadmin = false;
    let viewerGender: string | undefined = undefined;

    if (params.viewerUserId) {
      const viewer = await this.userRepo.findById(params.viewerUserId);
      if (viewer) {
        if (viewer.role === 'superadmin') isSuperadmin = true;
        viewerGender = viewer.gender;
      }
    }

    const userProvince = (params.userProvinceId || '').toLowerCase().trim();
    const userCity = (params.userCityId || '').toLowerCase().trim();

    const nearYou: AEJob[] = [];
    const sameProvince: AEJob[] = [];
    const otherProvinces: AEJob[] = [];
    const remote: AEJob[] = [];

    for (const rawJob of activeJobs) {
      // Exclude women-only vacancies from feed if viewer is not female and not superadmin/owner
      if (rawJob.isWomenOnly) {
        const isOwner = Boolean(params.viewerUserId && rawJob.creatorId === params.viewerUserId);
        const isFemale = viewerGender === 'Femenino';
        if (!isSuperadmin && !isOwner && !isFemale) {
          continue;
        }
      }

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
    phone?: string,
  ): Promise<AEJobApplication> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('La vacante a la que intentás postularte no existe');
    const candidate = await this.userRepo.findById(candidateId);
    if (!candidate) throw new NotFoundException('Candidato no encontrado');

    if (job.isWomenOnly && candidate.role !== 'superadmin') {
      if (!candidate.gender || candidate.gender !== 'Femenino') {
        throw new BadRequestException('Esta búsqueda laboral está reservada exclusivamente para mujeres de acuerdo a las especificaciones del empleador.');
      }
    }

    const contactPhone = (phone || candidate.phone || '').trim();
    if (!contactPhone) {
      throw new BadRequestException('El número de contacto telefónico o WhatsApp es un requisito obligatorio para postularse.');
    }

    // Save phone to candidate profile if they didn't have one
    if (!candidate.phone && contactPhone) {
      await this.userRepo.update(candidateId, { phone: contactPhone });
      candidate.phone = contactPhone;
    }

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
      candidatePhone: contactPhone,
      candidatePhotoUrl: candidate.photoUrl,
      candidateHeadline: candidate.headline,
      candidateCityName: candidate.cityName,
      candidateProvinceName: candidate.provinceName,
      candidateCvAttachment: candidate.cvAttachment,
      candidatePhotos: candidate.photos || [],
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
