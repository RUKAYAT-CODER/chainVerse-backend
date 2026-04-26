import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import appConfig from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { AppService } from './app.service';
import { WorkerModule } from './worker/worker.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { MetricsModule } from './metrics/metrics.module';
import { TracingModule } from './tracing/tracing.module';
import { EmailModule } from './email/email.module';

// Course modules
import { AdminCourseModule } from './admin-course/admin-course.module';
import { TutorModule } from './tutor/tutor.module';
import { TutorCourseModule } from './tutor-course/tutor-course.module';
import { CourseDiscoveryModule } from './course-discovery/course-discovery.module';
import { CourseRatingsFeedbackModule } from './course-ratings-feedback/course-ratings-feedback.module';
import { StudentSavedCoursesModule } from './student-saved-courses/student-saved-courses.module';
import { StudentCartModule } from './student-cart/student-cart.module';
import { StudentEnrollmentModule } from './student-enrollment/student-enrollment.module';
import { CourseAnalyticsModule } from './course-analytics/course-analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    // Global JWT module — makes JwtService available to all guards/services
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwtSecret'),
        signOptions: { algorithm: 'HS256' },
      }),
      inject: [ConfigService],
    }),
    // MongoDB connection — reads mongoUri from app.config.ts which maps MONGO_URI
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongoUri'),
      }),
      inject: [ConfigService],
    }),
    WorkerModule,
    MetricsModule,
    TracingModule,
    EmailModule,
    // Tutor modules
    TutorModule,
    // Course modules
    AdminCourseModule,
    TutorCourseModule,
    CourseDiscoveryModule,
    CourseRatingsFeedbackModule,
    // Student modules
    StudentSavedCoursesModule,
    StudentCartModule,
    StudentEnrollmentModule,
    // Analytics
    CourseAnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply the throttler guard to every route in the application
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
