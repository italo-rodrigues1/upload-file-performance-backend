import { BlobServiceClient } from '@azure/storage-blob';
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

interface Resumable {
  resumableChunkNumber: number;
  resumableCurrentChunkSize: number;
  resumableTotalChunks: number;
  resumableFilename: string;
}

@Injectable()
export class UploadFileService {
  async initializeBlobService(container: string) {
    console.log('process.env.BLOB_SAS_URL', process.env.BLOB_SAS_URL);
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.BLOB_SAS_URL,
      );
      const containerClient = blobServiceClient.getContainerClient(container);

      const verificationContainer = await containerClient.exists();

      if (!verificationContainer) {
        await containerClient.create();
      }

      return containerClient;
    } catch (err) {
      console.error('Error initializing Blob Service:', err);
      throw err;
    }
  }

  async readSpreadsheet(file: any) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);

    workbook.eachSheet((sheet, sheetId) => {
      console.log(`Sheet ID: ${sheetId}`);
      console.log(`Sheet Name: ${sheet.name}`);

      sheet.eachRow((row, rowNumber) => {
        console.log(`Row ${rowNumber}: ${row.values}`);
      });
    });
  }

  async upload({
    file,
    resumable,
  }: {
    file: any;
    resumable: Resumable;
  }): Promise<void> {
    const {
      resumableChunkNumber,
      resumableCurrentChunkSize,
      resumableTotalChunks,
      resumableFilename,
    } = resumable;

    try {
      const blobServiceContainer = await this.initializeBlobService('files');
      const blockBlobClient =
        blobServiceContainer.getBlockBlobClient(resumableFilename);

      const blockIdBase64 = Buffer.from(
        `block-${resumableChunkNumber.toString().padStart(6, '0')}`,
      ).toString('base64');

      await blockBlobClient.stageBlock(
        blockIdBase64,
        file[0].buffer,
        resumableCurrentChunkSize,
      );

      console.log('blockIdBase64', blockIdBase64);

      if (resumableChunkNumber === resumableTotalChunks) {
        const blockList = Array.from(
          { length: resumableTotalChunks },
          (_, i) => {
            return Buffer.from(
              `block-${(i + 1).toString().padStart(6, '0')}`,
            ).toString('base64');
          },
        );

        console.log('blockList', blockList);
        await blockBlobClient.commitBlockList(blockList);
      }
    } catch (e) {
      console.error('Error uploading file:', e);
      throw e;
    }
  }
}
