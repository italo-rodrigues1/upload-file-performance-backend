import { Module } from '@nestjs/common';
import { UploadFileController } from './app.controller';
import { UploadFileService } from './upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
        files: 5,
      },
    }),
    ConfigModule.forRoot(),
  ],
  controllers: [UploadFileController],
  providers: [UploadFileService],
})
export class AppModule {}
