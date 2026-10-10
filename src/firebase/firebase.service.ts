import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

    if (!getApps().length && projectId && privateKey && clientEmail) {
      try {
        initializeApp({
          credential: cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        console.log('Firebase Admin initialized successfully');
      } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
      }
    } else if (!getApps().length) {
      console.warn('Firebase credentials missing from environment variables.');
    }
  }

  getAuth() {
    return getAuth();
  }
}
