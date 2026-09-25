import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { DeepSeekService } from './infrastructure/deepseek/deepseek.service';
import { GitHubClientService } from './infrastructure/github/github-client.service';
import { LocalGitService } from './infrastructure/git/local-git.service';
import { GeminiService } from './infrastructure/gemini/gemini.service';
import { ChatGPTService } from './infrastructure/chatgpt/chatgpt.service';
import { FirebaseAuthService } from './infrastructure/firebase/firebase-auth.service';
import { FirebaseModule } from './infrastructure/firebase/firebase.module';
import { AUTH_SERVICE } from './domain/authentication/auth-service.interface';

import { AuthApplicationService } from './application/authentication/auth.service';
import { WorkspaceApplicationService } from './application/workspace/workspace.service';
import { ProjectApplicationService } from './application/project/project.service';
import { RepositoryApplicationService } from './application/repository/repository.service';
import { ObjectiveApplicationService } from './application/objective/objective.service';
import { AIEngineService } from './application/analysis/ai-engine.service';
import { SyncEngineService } from './application/analysis/sync-engine.service';
import { TimelineEngineService } from './application/analysis/timeline-engine.service';
import { ReportEngineService } from './application/analysis/report-engine.service';
import { ReleaseNotesEngineService } from './application/analysis/release-notes.service';
import { SprintPlannerService } from './application/analysis/sprint-planner.service';
import { KnowledgeBaseService } from './application/analysis/knowledge-base.service';
import { NotificationEngineService } from './application/analysis/notification-engine.service';
import { CodebaseAnalyzerService } from './application/analysis/codebase-analyzer.service';
import { ChatService } from './application/chat/chat.service';

import { AuthController } from './presentation/controllers/auth.controller';
import { WorkspaceController } from './presentation/controllers/workspace.controller';
import { ProjectController } from './presentation/controllers/project.controller';
import { ObjectiveController } from './presentation/controllers/objective.controller';
import { RepositoryController } from './presentation/controllers/repository.controller';
import { ChatController } from './presentation/controllers/chat.controller';
import { EngineController } from './presentation/controllers/engine.controller';
import { EngineService } from './application/engine/engine.service';

import { AUTH_REPOSITORY } from './domain/authentication/auth.repository.interface';
import { WORKSPACE_REPOSITORY } from './domain/workspace/workspace.repository.interface';
import { PROJECT_REPOSITORY } from './domain/project/project.repository.interface';
import { REPOSITORY_REPOSITORY } from './domain/repository/repository.repository.interface';
import { OBJECTIVE_REPOSITORY } from './domain/objective/objective.repository.interface';
import { TIMELINE_REPOSITORY } from './domain/timeline/timeline.repository.interface';
import { REPORT_REPOSITORY } from './domain/report/report.repository.interface';
import { RELEASE_NOTES_REPOSITORY } from './domain/release/release-notes.repository.interface';
import { SPRINT_REPOSITORY } from './domain/sprint/sprint.repository.interface';
import { NOTIFICATION_REPOSITORY } from './domain/notification/notification.repository.interface';
import { KNOWLEDGE_REPOSITORY } from './domain/knowledge/knowledge.repository.interface';
import { GITHUB_CLIENT } from './infrastructure/github/github-client.interface';

import { FirestoreAuthRepository } from './infrastructure/persistence/firestore-auth.repository';
import { FirestoreWorkspaceRepository } from './infrastructure/persistence/firestore-workspace.repository';
import { FirestoreProjectRepository } from './infrastructure/persistence/firestore-project.repository';
import { FirestoreRepositoryRepository } from './infrastructure/persistence/firestore-repository.repository';
import { FirestoreObjectiveRepository } from './infrastructure/persistence/firestore-objective.repository';
import { FirestoreTimelineRepository } from './infrastructure/persistence/firestore-timeline.repository';
import { FirestoreReportRepository } from './infrastructure/persistence/firestore-report.repository';
import { FirestoreReleaseNotesRepository } from './infrastructure/persistence/firestore-release-notes.repository';
import { FirestoreSprintRepository } from './infrastructure/persistence/firestore-sprint.repository';
import { FirestoreNotificationRepository } from './infrastructure/persistence/firestore-notification.repository';
import { FirestoreKnowledgeRepository } from './infrastructure/persistence/firestore-knowledge.repository';

import { DocumentApplicationService } from './application/document/document.service';
import { DocumentController } from './presentation/controllers/document.controller';
import { DOCUMENT_REPOSITORY } from './domain/document/document.repository.interface';
import { FirestoreDocumentRepository } from './infrastructure/persistence/firestore-document.repository';

import { GmailService } from './infrastructure/gmail/gmail.service';
import { GmailController } from './presentation/controllers/gmail.controller';

import { GoogleDriveAdapter } from './infrastructure/google-drive/google-drive.adapter';
import { ReadDriveFileUseCase } from './application/drive/read-drive-file.use-case';
import { ListDriveFilesUseCase } from './application/drive/list-drive-files.use-case';
import { DriveController } from './presentation/controllers/drive.controller';

import { LeadsController } from './presentation/controllers/leads.controller';
import { CreateLeadUseCase } from './application/use-cases/leads/create-lead.use-case';
import { EnrichLeadUseCase } from './application/use-cases/leads/enrich-lead.use-case';
import { SendOutreachUseCase } from './application/use-cases/leads/send-outreach.use-case';
import { GeminiLeadEnrichmentService } from './infrastructure/services/gemini-lead-enrichment.service';
import { GmailOutreachService } from './infrastructure/services/gmail-outreach.service';
import { InMemoryLeadRepository } from './infrastructure/repositories/in-memory-lead.repository';
import { LeadDripSequenceCronService } from './infrastructure/services/lead-drip-sequence-cron.service';
import { HunterEnrichmentService } from './infrastructure/services/hunter-enrichment.service';
import { ApolloEnrichmentService } from './infrastructure/services/apollo-enrichment.service';

import { LinkedInService } from './infrastructure/linkedin/linkedin.service';
import { LinkedInController } from './presentation/controllers/linkedin.controller';
import { SapModule } from './infrastructure/sap/sap.module';

// RAS3 AI OPPORTUNITY ENGINE IMPORTS
import { CrawlerService } from './infrastructure/scraper/crawler.service';
import { ContactExtractorService } from './infrastructure/scraper/contact-extractor.service';
import { AIOrchestratorService } from './infrastructure/ai/ai-orchestrator.service';
import { OpportunityEngineService } from './application/opportunity/opportunity-engine.service';
import { OpportunityController } from './presentation/controllers/opportunity.controller';
import {
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
} from './domain/opportunity/opportunity.repository.interface';
import {
  FirestoreCompanyRepository,
  FirestoreCompanyAnalysisRepository,
  FirestoreJobRepository,
  FirestoreJobAnalysisRepository,
  FirestoreContactRepository,
  FirestoreOpportunityRepository,
  FirestoreApplicationRepository,
  FirestoreOutreachRepository,
  FirestoreMessageRepository,
  FirestoreProfileRepository,
  FirestoreCvRepository,
  FirestoreAIExecutionRepository,
} from './infrastructure/persistence/firestore-opportunity.repository';

// ARGENTINA EMPLEOS IMPORTS
import {
  AE_USER_REPOSITORY,
  AE_JOB_REPOSITORY,
  AE_WALLET_REPOSITORY,
  AE_TRANSACTION_REPOSITORY,
  AE_WITHDRAWAL_REPOSITORY,
  AE_ADMIN_LOG_REPOSITORY,
  AE_CATEGORY_REPOSITORY,
  AE_APPLICATION_REPOSITORY,
  AE_MESSAGE_REPOSITORY,
  AE_CREDIT_REQUEST_REPOSITORY,
  AE_NOTIFICATION_REPOSITORY,
} from './domain/argentina-empleos/ae.repository.interface';
import {
  FirestoreAEUserRepository,
  FirestoreAEJobRepository,
  FirestoreAEWalletRepository,
  FirestoreAETransactionRepository,
  FirestoreAEWithdrawalRepository,
  FirestoreAEAdminLogRepository,
  FirestoreAECategoryRepository,
  FirestoreAEApplicationRepository,
  FirestoreAEMessageRepository,
  FirestoreAECreditRequestRepository,
  FirestoreAENotificationRepository,
} from './infrastructure/argentina-empleos/firestore-ae.repositories';
import { AEAIService } from './infrastructure/argentina-empleos/ae-ai.service';
import { AEMercadoPagoService } from './infrastructure/argentina-empleos/ae-mercadopago.service';
import { AEStorageService } from './infrastructure/argentina-empleos/ae-storage.service';
import { AEAuthService } from './application/argentina-empleos/ae-auth.service';
import { AEJobService } from './application/argentina-empleos/ae-job.service';
import { AEWalletService } from './application/argentina-empleos/ae-wallet.service';
import { AEAdminService } from './application/argentina-empleos/ae-admin.service';
import { AEMessagingService } from './application/argentina-empleos/ae-messaging.service';
import { AECreditRequestService } from './application/argentina-empleos/ae-credit-request.service';
import { AEAuthController } from './presentation/controllers/argentina-empleos/ae-auth.controller';
import { AEJobsController } from './presentation/controllers/argentina-empleos/ae-jobs.controller';
import { AEWalletController } from './presentation/controllers/argentina-empleos/ae-wallet.controller';
import { AEAdminController } from './presentation/controllers/argentina-empleos/ae-admin.controller';
import { AEMessagingController } from './presentation/controllers/argentina-empleos/ae-messaging.controller';

const firestoreProviders = [

  { provide: AUTH_REPOSITORY, useClass: FirestoreAuthRepository },
  { provide: WORKSPACE_REPOSITORY, useClass: FirestoreWorkspaceRepository },
  { provide: PROJECT_REPOSITORY, useClass: FirestoreProjectRepository },
  { provide: REPOSITORY_REPOSITORY, useClass: FirestoreRepositoryRepository },
  { provide: OBJECTIVE_REPOSITORY, useClass: FirestoreObjectiveRepository },
  { provide: TIMELINE_REPOSITORY, useClass: FirestoreTimelineRepository },
  { provide: REPORT_REPOSITORY, useClass: FirestoreReportRepository },
  { provide: RELEASE_NOTES_REPOSITORY, useClass: FirestoreReleaseNotesRepository },
  { provide: SPRINT_REPOSITORY, useClass: FirestoreSprintRepository },
  { provide: NOTIFICATION_REPOSITORY, useClass: FirestoreNotificationRepository },
  { provide: KNOWLEDGE_REPOSITORY, useClass: FirestoreKnowledgeRepository },
  { provide: DOCUMENT_REPOSITORY, useClass: FirestoreDocumentRepository },
  { provide: 'IDriveRepository', useClass: GoogleDriveAdapter },
  { provide: 'ILeadRepository', useClass: InMemoryLeadRepository },
  // Opportunity Engine Providers
  { provide: COMPANY_REPOSITORY, useClass: FirestoreCompanyRepository },
  { provide: COMPANY_ANALYSIS_REPOSITORY, useClass: FirestoreCompanyAnalysisRepository },
  { provide: JOB_REPOSITORY, useClass: FirestoreJobRepository },
  { provide: JOB_ANALYSIS_REPOSITORY, useClass: FirestoreJobAnalysisRepository },
  { provide: CONTACT_REPOSITORY, useClass: FirestoreContactRepository },
  { provide: OPPORTUNITY_REPOSITORY, useClass: FirestoreOpportunityRepository },
  { provide: APPLICATION_REPOSITORY, useClass: FirestoreApplicationRepository },
  { provide: OUTREACH_REPOSITORY, useClass: FirestoreOutreachRepository },
  { provide: MESSAGE_REPOSITORY, useClass: FirestoreMessageRepository },
  { provide: PROFILE_REPOSITORY, useClass: FirestoreProfileRepository },
  { provide: CV_REPOSITORY, useClass: FirestoreCvRepository },
  { provide: AI_EXECUTION_REPOSITORY, useClass: FirestoreAIExecutionRepository },
  // Argentina Empleos Providers
  { provide: AE_USER_REPOSITORY, useClass: FirestoreAEUserRepository },
  { provide: AE_JOB_REPOSITORY, useClass: FirestoreAEJobRepository },
  { provide: AE_WALLET_REPOSITORY, useClass: FirestoreAEWalletRepository },
  { provide: AE_TRANSACTION_REPOSITORY, useClass: FirestoreAETransactionRepository },
  { provide: AE_WITHDRAWAL_REPOSITORY, useClass: FirestoreAEWithdrawalRepository },
  { provide: AE_ADMIN_LOG_REPOSITORY, useClass: FirestoreAEAdminLogRepository },
  { provide: AE_CATEGORY_REPOSITORY, useClass: FirestoreAECategoryRepository },
  { provide: AE_APPLICATION_REPOSITORY, useClass: FirestoreAEApplicationRepository },
  { provide: AE_MESSAGE_REPOSITORY, useClass: FirestoreAEMessageRepository },
  { provide: AE_CREDIT_REQUEST_REPOSITORY, useClass: FirestoreAECreditRequestRepository },
  { provide: AE_NOTIFICATION_REPOSITORY, useClass: FirestoreAENotificationRepository },
];

import { Ris3TerritoryModule } from './infrastructure/ris3/ris3-territory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'backend/.env'] }),
    ScheduleModule.forRoot(),
    FirebaseModule,
    SapModule,
    Ris3TerritoryModule,
  ],
  controllers: [
    AuthController,
    WorkspaceController,
    ProjectController,
    ObjectiveController,
    RepositoryController,
    ChatController,
    EngineController,
    DocumentController,
    GmailController,
    DriveController,
    LeadsController,
    LinkedInController,
    OpportunityController,
    // Argentina Empleos Controllers
    AEAuthController,
    AEJobsController,
    AEWalletController,
    AEAdminController,
    AEMessagingController,
  ],
  providers: [
    AuthApplicationService,
    WorkspaceApplicationService,
    ProjectApplicationService,
    RepositoryApplicationService,
    ObjectiveApplicationService,
    DocumentApplicationService,
    AIEngineService,
    SyncEngineService,

    TimelineEngineService,
    ReportEngineService,
    ReleaseNotesEngineService,
    SprintPlannerService,
    KnowledgeBaseService,
    NotificationEngineService,
    CodebaseAnalyzerService,
    DeepSeekService,
    ChatService,
    EngineService,
    GeminiService,
    ChatGPTService,
    LocalGitService,
    GmailService,
    GoogleDriveAdapter,
    ReadDriveFileUseCase,
    ListDriveFilesUseCase,
    CreateLeadUseCase,
    EnrichLeadUseCase,
    SendOutreachUseCase,
    GeminiLeadEnrichmentService,
    GmailOutreachService,
    LeadDripSequenceCronService,
    HunterEnrichmentService,
    ApolloEnrichmentService,
    LinkedInService,
    // Opportunity Engine Services
    CrawlerService,
    ContactExtractorService,
    AIOrchestratorService,
    OpportunityEngineService,
    // Argentina Empleos Services
    AEAIService,
    AEMercadoPagoService,
    AEStorageService,
    AEAuthService,
    AEJobService,
    AEWalletService,
    AEAdminService,
    AEMessagingService,
    AECreditRequestService,
    { provide: GITHUB_CLIENT, useClass: GitHubClientService },
    { provide: AUTH_SERVICE, useClass: FirebaseAuthService },
    ...firestoreProviders,
  ],
})
export class AppModule {}

