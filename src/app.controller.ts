import {
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UploadFileService } from './upload.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express, Request } from 'express';

@Controller('uploads')
export class UploadFileController {
  constructor(private readonly uploadFileService: UploadFileService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('file'))
  async uploadFiles(
    @UploadedFiles()
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    console.log('req', req.body);
    console.log(file);
    if (!file) {
      throw new Error('No file uploaded');
    }

    const { totalChunks, chunkNumber, fileName } = req.body;

    console.log('req.body', totalChunks, chunkNumber);

    await this.uploadFileService.upload({
      file,
      resumable: {
        resumableChunkNumber: Number(chunkNumber),
        resumableCurrentChunkSize: file[0].size,
        resumableTotalChunks: Number(totalChunks),
        resumableFilename: fileName,
      },
    });
    return { status: 'success', file };
  }
}
