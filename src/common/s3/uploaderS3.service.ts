import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigType } from '@nestjs/config';
import { S3Provider } from './s3-provider.constant';
import s3Config from 'src/config/bucket.config';
import { LoggerService } from '../loggers/domain/logger.service';

export interface S3Result {
  readonly expires: number;
  readonly urlImage: string;
}

@Injectable()
export class UploaderS3Service {
  constructor(
    @Inject(s3Config.KEY)
    private readonly configService: ConfigType<typeof s3Config>,
    private readonly loggerService: LoggerService,
    @Inject(S3Provider)
    private readonly s3Provider: S3,
  ) {
    this.loggerService.contextName = UploaderS3Service.name;
  }

  public async upload(base64File: string, referenceKey: string, fileType: string): Promise<void> {
    try {
      if (!base64File) {
        throw new HttpException('base64File is null or undefined', HttpStatus.BAD_REQUEST);
      }
      if (!referenceKey) {
        throw new HttpException('referenceKey is null or undefined', HttpStatus.BAD_REQUEST);
      }
      if (!fileType) {
        throw new HttpException('fileType is null or undefined', HttpStatus.BAD_REQUEST);
      }

      const buffer = Buffer.from(base64File.replace(/^data:[^;]+;base64,/, ''), 'base64');
      const contentType = this.getContentType(fileType);
      const data: S3.PutObjectRequest = {
        Bucket: this.configService.bucket,
        Key: `${contentType.split('/')[0]}/${referenceKey}.${fileType}`,
        Body: buffer,
        ContentEncoding: 'base64',
        ContentType: contentType,
        ContentLength: buffer.length,
      };

      await this.s3Provider.putObject(data).promise();
      this.loggerService.info(
        `Uploading file ${referenceKey}.${fileType} to bucket ${this.configService.bucket}`,
      );
    } catch (error) {
      this.loggerService.error(
        `Error uploading file ${referenceKey}.${fileType} to bucket ${this.configService.bucket}`,
        error,
      );
      throw error;
    }
  }

  public async getUrl(
    referenceKey: string,
    fileType: string,
    expiresInSeconds: number,
  ): Promise<S3Result> {
    try {
      if (!referenceKey) {
        throw new HttpException('referenceKey is null or undefined', HttpStatus.BAD_REQUEST);
      }

      if (!fileType) {
        throw new HttpException('fileType is null or undefined', HttpStatus.BAD_REQUEST);
      }

      this.loggerService.info(`Called method: ${this.getUrl.name}()`);

      const params: S3.GetObjectRequest = expiresInSeconds
        ? {
            Bucket: this.configService.bucket,
            Key: `${referenceKey}.${fileType}`,
            ResponseExpires: new Date(Date.now() + expiresInSeconds * 1000),
          }
        : {
            Bucket: this.configService.bucket,
            Key: `${referenceKey}.${fileType}`,
          };

      const url = await this.s3Provider.getSignedUrlPromise('getObject', params);
      return {
        expires: expiresInSeconds,
        urlImage: url,
      };
    } catch (error) {
      this.loggerService.error(
        `Error getting URL for file ${referenceKey}.${fileType} from bucket ${this.configService.bucket}`,
        error,
      );
      throw error;
    }
  }

  public async delete(referenceKey: string, fileType: string): Promise<void> {
    try {
      if (!referenceKey) {
        throw new HttpException('referenceKey is null or undefined', HttpStatus.BAD_REQUEST);
      }

      if (!fileType) {
        throw new HttpException('fileType is null or undefined', HttpStatus.BAD_REQUEST);
      }

      this.loggerService.info(`Called method: ${this.delete.name}()`);

      const params: S3.DeleteObjectRequest = {
        Bucket: this.configService.bucket,
        Key: `${this.getContentType(fileType).split('/')[0]}/${referenceKey}.${fileType}`,
      };

      await this.s3Provider.deleteObject(params).promise();
      this.loggerService.info(
        `Deleting file ${referenceKey}.${fileType} from  bucket ${this.configService.bucket}`,
      );
    } catch (error) {
      this.loggerService.error(
        `Error deleting file ${referenceKey}.${fileType} from bucket ${this.configService.bucket}`,
        error,
      );
      throw error;
    }
  }

  private getContentType(fileType: string): string {
    switch (fileType) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return `image/${fileType}`;
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      default:
        return 'application/octet-stream';
    }
  }
}
