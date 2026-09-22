import { Injectable, Inject, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
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
  COMPANY_REPOSITORY,
  COMPANY_ANALYSIS_REPOSITORY,
  JOB_REPOSITORY,
  JOB_ANALYSIS_REPOSITORY,
  CONTACT_REPOSITORY,
  OPPORTUNITY_REPOSITORY,
  APPLICATION_REPOSITORY,
  OUTREACH_REPOSITORY,
  MESSAGE_REPOSITORY,
  PROFILE_REPOSITORY,
  CV_REPOSITORY,
  AI_EXECUTION_REPOSITORY,
} from '../../domain/opportunity/opportunity.repository.interface';
import {
  ICompany,
  ICompanyAnalysis,
  IJob,
  IJobAnalysis,
  IContact,
  IOpportunity,
  IProfile,
  ICv,
  IMessage,
  IOutreach,
  IApplication,
  OpportunityType,
  ApplicationStatus,
  OutreachStatus,
  MessageType,
  ConfidenceLevel,
} from '../../domain/opportunity/opportunity.entity';
import { CrawlerService } from '../../infrastructure/scraper/crawler.service';
import { ContactExtractorService } from '../../infrastructure/scraper/contact-extractor.service';
import { AIOrchestratorService } from '../../infrastructure/ai/ai-orchestrator.service';
import { GmailService } from '../../infrastructure/gmail/gmail.service';

@Injectable()
export class OpportunityEngineService {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: ICompanyRepository,
    @Inject(COMPANY_ANALYSIS_REPOSITORY) private readonly analysisRepo: ICompanyAnalysisRepository,
    @Inject(JOB_REPOSITORY) private readonly jobRepo: IJobRepository,
    @Inject(JOB_ANALYSIS_REPOSITORY) private readonly jobAnalysisRepo: IJobAnalysisRepository,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: IContactRepository,
    @Inject(OPPORTUNITY_REPOSITORY) private readonly oppRepo: IOpportunityRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly appRepo: IApplicationRepository,
    @Inject(OUTREACH_REPOSITORY) private readonly outreachRepo: IOutreachRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly msgRepo: IMessageRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profileRepo: IProfileRepository,
    @Inject(CV_REPOSITORY) private readonly cvRepo: ICvRepository,
    @Inject(AI_EXECUTION_REPOSITORY) private readonly executionRepo: IAIExecutionRepository,
    private readonly crawler: CrawlerService,
    private readonly contactExtractor: ContactExtractorService,
    private readonly aiOrchestrator: AIOrchestratorService,
    @Optional() private readonly gmailService?: GmailService,
  ) {}

  // 1. COMPANY ANALYZER & CLIENT MODE
  async analyzeCompany(targetUrl: string, userId: string): Promise<{
    company: ICompany;
    analysis: ICompanyAnalysis;
    contacts: IContact[];
    opportunities: IOpportunity[];
  }> {
    const scraped = await this.crawler.scrapeUrl(targetUrl);
    const domain = scraped.normalizedDomain;

    // Retrieve or create company entity
    let company = await this.companyRepo.findByDomain(domain);
    const now = new Date();

    const companyName = scraped.title.includes('|')
      ? scraped.title.split('|')[0].trim()
      : scraped.title.includes('-')
      ? scraped.title.split('-')[0].trim()
      : scraped.title || domain;

    if (!company) {
      company = {
        id: uuidv4(),
        name: companyName,
        normalizedName: domain,
        domain,
        website: scraped.url,
        description: scraped.description,
        technologies: scraped.detectedTechnologies,
        socialLinks: scraped.socialLinks,
        careersUrl: scraped.careersUrl,
        contactMethods: scraped.contactMethods,
        lastAnalyzedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await this.companyRepo.save(company);
    } else {
      company.description = company.description || scraped.description;
      company.technologies = Array.from(new Set([...(company.technologies || []), ...scraped.detectedTechnologies]));
      company.socialLinks = { ...company.socialLinks, ...scraped.socialLinks };
      company.careersUrl = company.careersUrl || scraped.careersUrl;
      company.lastAnalyzedAt = now;
      company.updatedAt = now;
      await this.companyRepo.update(company);
    }

    // Extract Public Contacts
    const { contacts: extractedContacts, contactMethods } = this.contactExtractor.extractContacts(
      scraped.cleanedText,
      scraped.rawText,
      scraped.url,
    );

    const savedContacts: IContact[] = [];
    for (const ec of extractedContacts) {
      const contactId = uuidv4();
      const newContact: IContact = {
        id: contactId,
        userId,
        companyId: company.id,
        companyName: company.name,
        name: ec.name,
        email: ec.email,
        phone: ec.phone,
        role: ec.role,
        type: ec.type,
        sourceUrl: ec.sourceUrl,
        confidence: ec.confidence,
        createdAt: now,
        updatedAt: now,
      };
      await this.contactRepo.save(newContact);
      savedContacts.push(newContact);
    }

    // Get User Profile services for contextual matching
    const profile = await this.profileRepo.findById(userId);
    const userServices = profile?.services || ['Desarrollo Web', 'Automatización con IA', 'Sistemas a Medida', 'APIs'];

    // Run AI Analysis & Digital Gap
    const aiResult = await this.aiOrchestrator.analyzeCompany(
      domain,
      scraped.title,
      scraped.description,
      scraped.cleanedText,
      scraped.detectedTechnologies,
      userServices,
    );

    const analysisId = uuidv4();
    const analysis: ICompanyAnalysis = {
      id: analysisId,
      companyId: company.id,
      userId,
      sourceUrl: scraped.url,
      crawledPages: [{ url: scraped.url, title: scraped.title, status: scraped.status }],
      observedSignals: aiResult.observedSignals,
      technologies: scraped.detectedTechnologies,
      contactsFound: savedContacts.length,
      contactMethods: [...(company.contactMethods || []), ...contactMethods],
      digitalPresence: aiResult.digitalPresence,
      possibleOpportunities: aiResult.possibleOpportunities,
      confidence: aiResult.confidence,
      confidenceReasoning: aiResult.confidenceReasoning,
      aiProvider: aiResult.providerUsed,
      model: 'AI-Opportunity-Model',
      createdAt: now,
    };
    await this.analysisRepo.save(analysis);

    // Create Opportunities from AI results
    const createdOpportunities: IOpportunity[] = [];
    for (const opp of aiResult.possibleOpportunities) {
      const oppId = uuidv4();
      const newOpp: IOpportunity = {
        id: oppId,
        userId,
        type: OpportunityType.CLIENT,
        companyId: company.id,
        companyName: company.name,
        title: opp.title,
        description: opp.description,
        evidence: opp.evidence,
        possibleNeeds: [opp.possibleSolution],
        suggestedServices: aiResult.suggestedServices,
        confidence: opp.confidence,
        recommendedContactIds: savedContacts.map((c) => c.id),
        status: OutreachStatus.OPPORTUNITY_FOUND,
        createdAt: now,
        updatedAt: now,
      };
      await this.oppRepo.save(newOpp);
      createdOpportunities.push(newOpp);
    }

    return {
      company,
      analysis,
      contacts: savedContacts,
      opportunities: createdOpportunities,
    };
  }

  // 2. JOB ANALYZER & JOB MODE
  async analyzeJob(
    inputUrlOrText: string,
    userId: string,
    companyId?: string,
  ): Promise<{
    job: IJob;
    analysis: IJobAnalysis;
    opportunity: IOpportunity;
  }> {
    let jobText = inputUrlOrText;
    let sourceUrl: string | undefined = undefined;

    if (inputUrlOrText.startsWith('http://') || inputUrlOrText.startsWith('https://')) {
      sourceUrl = inputUrlOrText;
      const scraped = await this.crawler.scrapeUrl(inputUrlOrText);
      jobText = `${scraped.title}\n${scraped.description}\n${scraped.cleanedText}`;
    }

    const profile = await this.profileRepo.findById(userId);
    const cvs = await this.cvRepo.findByUserId(userId);

    const aiResult = await this.aiOrchestrator.analyzeJob(jobText, profile, cvs);
    const now = new Date();

    const jobId = uuidv4();
    const job: IJob = {
      id: jobId,
      companyId: companyId || undefined,
      companyName: aiResult.companyName,
      userId,
      title: aiResult.title,
      description: jobText.slice(0, 3000),
      location: aiResult.location,
      employmentType: aiResult.employmentType,
      salary: aiResult.salary,
      technologies: aiResult.technologies,
      requirements: aiResult.requirements,
      experience: aiResult.experience,
      language: aiResult.language,
      sourceUrl,
      applicationUrl: sourceUrl,
      applicationMethod: aiResult.applicationMethod,
      status: ApplicationStatus.ANALYZED,
      createdAt: now,
      updatedAt: now,
    };
    await this.jobRepo.save(job);

    const analysisId = uuidv4();
    const analysis: IJobAnalysis = {
      id: analysisId,
      jobId: job.id,
      userId,
      matchSignals: aiResult.matchSignals,
      matchedSkills: aiResult.matchedSkills,
      missingSkills: aiResult.missingSkills,
      strengths: aiResult.strengths,
      concerns: aiResult.concerns,
      explanation: aiResult.explanation,
      heuristicScore: aiResult.heuristicScore,
      selectedCvId: aiResult.recommendedCvId || cvs[0]?.id,
      recommendedCvName: aiResult.recommendedCvName,
      language: aiResult.language,
      aiProvider: aiResult.providerUsed,
      model: 'AI-Job-Model',
      createdAt: now,
    };
    await this.jobAnalysisRepo.save(analysis);

    const oppId = uuidv4();
    const opportunity: IOpportunity = {
      id: oppId,
      userId,
      type: OpportunityType.JOB,
      companyId: job.companyId,
      companyName: job.companyName,
      jobId: job.id,
      title: `Empleo: ${job.title} en ${job.companyName}`,
      description: aiResult.explanation,
      evidence: aiResult.strengths,
      possibleNeeds: aiResult.requirements,
      suggestedServices: aiResult.matchedSkills,
      confidence: aiResult.matchSignals.skills,
      recommendedContactIds: [],
      status: ApplicationStatus.ANALYZED,
      createdAt: now,
      updatedAt: now,
    };
    await this.oppRepo.save(opportunity);

    return { job, analysis, opportunity };
  }

  // 3. MESSAGE & PROPOSAL GENERATION
  async generateOutreachMessage(params: {
    userId: string;
    opportunityId?: string;
    contactId?: string;
    type: MessageType;
    language?: string;
    tone?: string;
  }): Promise<IMessage> {
    let companyName = 'Empresa';
    let contactName = '';
    let evidence: string[] = [];
    let possibleOpportunity = '';
    let contactEmail = '';

    if (params.opportunityId) {
      const opp = await this.oppRepo.findById(params.opportunityId);
      if (opp) {
        companyName = opp.companyName || companyName;
        evidence = opp.evidence;
        possibleOpportunity = opp.title;
      }
    }

    if (params.contactId) {
      const contact = await this.contactRepo.findById(params.contactId);
      if (contact) {
        contactName = contact.name;
        contactEmail = contact.email || '';
        companyName = contact.companyName || companyName;
      }
    }

    const profile = await this.profileRepo.findById(params.userId);

    const generated = await this.aiOrchestrator.generateMessage({
      type: params.type,
      companyName,
      contactName,
      evidence,
      possibleOpportunity,
      userServices: profile?.services,
      userProfile: profile,
      language: params.language || 'es',
      tone: params.tone,
    });

    const now = new Date();
    const message: IMessage = {
      id: uuidv4(),
      userId: params.userId,
      opportunityId: params.opportunityId,
      contactId: params.contactId,
      companyName,
      contactEmail,
      type: params.type,
      language: params.language || 'es',
      subject: generated.subject,
      body: generated.body,
      aiProvider: generated.providerUsed,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };
    await this.msgRepo.save(message);

    // Save or update outreach item
    const outreach: IOutreach = {
      id: uuidv4(),
      userId: params.userId,
      opportunityId: params.opportunityId,
      contactId: params.contactId,
      messageId: message.id,
      channel: generated.suggestedChannel || 'Email',
      status: OutreachStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    };
    await this.outreachRepo.save(outreach);

    return message;
  }

  // 4. METRICS & PIPELINE SUMMARY
  async getMetrics(userId: string) {
    const opportunities = await this.oppRepo.findByUserId(userId);
    const companies = await this.companyRepo.findAll();
    const contacts = await this.contactRepo.findByUserId(userId);
    const jobs = await this.jobRepo.findByUserId(userId);
    const outreachList = await this.outreachRepo.findByUserId(userId);
    const applications = await this.appRepo.findByUserId(userId);

    const jobOpps = opportunities.filter((o) => o.type === OpportunityType.JOB);
    const clientOpps = opportunities.filter((o) => o.type === OpportunityType.CLIENT);

    return {
      jobsFound: jobs.length,
      jobsSaved: jobOpps.length,
      applications: applications.length,
      interviews: applications.filter((a) => a.status === ApplicationStatus.INTERVIEW).length,
      companiesAnalyzed: companies.length,
      potentialClients: clientOpps.length,
      opportunitiesDetected: opportunities.length,
      contactsFound: contacts.length,
      outreachDrafts: outreachList.filter((o) => o.status === OutreachStatus.DRAFT).length,
      outreachSent: outreachList.filter((o) => o.status === OutreachStatus.CONTACTED).length,
      replies: outreachList.filter((o) => o.status === OutreachStatus.REPLIED).length,
      meetings: outreachList.filter((o) => o.status === OutreachStatus.MEETING).length,
    };
  }

  // 5. PROFILE & CV METHODS
  async getProfile(userId: string): Promise<IProfile | null> {
    return this.profileRepo.findById(userId);
  }

  async saveProfile(profile: IProfile): Promise<IProfile> {
    const existing = await this.profileRepo.findById(profile.id);
    profile.updatedAt = new Date();
    if (existing) {
      await this.profileRepo.update(profile);
    } else {
      profile.createdAt = new Date();
      await this.profileRepo.save(profile);
    }
    return profile;
  }

  async getCvs(userId: string): Promise<ICv[]> {
    return this.cvRepo.findByUserId(userId);
  }

  async saveCv(cv: ICv): Promise<ICv> {
    const now = new Date();
    if (!cv.id) cv.id = uuidv4();
    cv.createdAt = cv.createdAt || now;
    cv.updatedAt = now;
    await this.cvRepo.save(cv);
    return cv;
  }

  async deleteCv(id: string): Promise<void> {
    await this.cvRepo.delete(id);
  }

  // 6. GENERAL RETRIEVALS
  async getOpportunities(userId: string, type?: 'job' | 'client'): Promise<IOpportunity[]> {
    if (type) {
      return this.oppRepo.findByType(userId, type);
    }
    return this.oppRepo.findByUserId(userId);
  }

  async getCompanies(): Promise<ICompany[]> {
    return this.companyRepo.findAll();
  }

  async getCompanyById(id: string): Promise<ICompany | null> {
    return this.companyRepo.findById(id);
  }

  async deleteCompany(id: string): Promise<void> {
    await this.companyRepo.delete(id);
  }

  async clearCompanies(): Promise<void> {
    const all = await this.companyRepo.findAll();
    for (const c of all) {
      await this.companyRepo.delete(c.id);
    }
  }

  async getContacts(userId: string): Promise<IContact[]> {
    return this.contactRepo.findByUserId(userId);
  }

  async getJobs(userId: string): Promise<IJob[]> {
    return this.jobRepo.findByUserId(userId);
  }

  async getMessages(userId: string): Promise<IMessage[]> {
    return this.msgRepo.findByUserId(userId);
  }

  async getOutreach(userId: string): Promise<IOutreach[]> {
    return this.outreachRepo.findByUserId(userId);
  }

  async sendEmailDirect(params: {
    userId: string;
    accessToken: string;
    to: string;
    subject: string;
    body: string;
    opportunityId?: string;
    contactId?: string;
    messageId?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    if (!this.gmailService) {
      throw new Error('Servicio de Gmail no disponible.');
    }
    const htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
      ${params.body.replace(/\n/g, '<br/>')}
    </div>`;

    const res = await this.gmailService.sendEmail(params.accessToken, params.to, params.subject, htmlBody);

    const now = new Date();
    const outreach: IOutreach = {
      id: uuidv4(),
      userId: params.userId,
      opportunityId: params.opportunityId,
      contactId: params.contactId,
      messageId: params.messageId,
      channel: 'Gmail',
      status: OutreachStatus.CONTACTED,
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await this.outreachRepo.save(outreach);

    return res;
  }

  async refineText(params: {
    userId: string;
    originalText: string;
    instruction: string;
  }): Promise<{ refinedText: string }> {
    const profile = await this.profileRepo.findById(params.userId);
    return this.aiOrchestrator.refineText({
      originalText: params.originalText,
      instruction: params.instruction,
      userProfile: profile,
    });
  }
}

