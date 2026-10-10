import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { OpenaiModule } from './openai/openai.module.js';
import { FirebaseModule } from './firebase/firebase.module.js';
import { KidsModule } from './kids/kids.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    OpenaiModule,
    FirebaseModule,
    KidsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
