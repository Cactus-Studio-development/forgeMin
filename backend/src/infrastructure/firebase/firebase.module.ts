import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Global()
@Module({})
export class FirebaseModule implements OnModuleInit {
  private readonly logger = new Logger(FirebaseModule.name);

  onModuleInit() {
    if (!firebase.apps.length) {
      const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      let serviceAccount: any = undefined;

      if (serviceAccountEnv) {
        const potentialPaths = [
          path.resolve(process.cwd(), serviceAccountEnv),
          path.resolve(process.cwd(), 'backend', serviceAccountEnv),
          path.resolve(__dirname, '../../../../', serviceAccountEnv),
        ];

        for (const p of potentialPaths) {
          if (fs.existsSync(p)) {
            try {
              serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
              this.logger.log(`Loaded Firebase service account from ${p}`);
              break;
            } catch (err: any) {
              this.logger.warn(`Failed to parse service account from ${p}: ${err.message}`);
            }
          }
        }
      }

      firebase.initializeApp(
        serviceAccount
          ? { credential: firebase.credential.cert(serviceAccount) }
          : { projectId: process.env.FIREBASE_PROJECT_ID || 'forgeminproyect' },
      );

      firebase.firestore().settings({ ignoreUndefinedProperties: true });
      this.logger.log(`Firebase initialized for project: ${process.env.FIREBASE_PROJECT_ID || 'forgeminproyect'}`);
    }
  }
}
