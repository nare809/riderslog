import { Controller, Get, Param, Res, NotFoundException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Controller('images')
export class ImagesController {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly logger = new Logger(ImagesController.name);

    constructor() {
        const accountId = process.env.R2_ACCOUNT_ID;
        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
        });
        this.bucketName = process.env.R2_BUCKET_NAME || 'cars-website';
    }

    @Get('*path')
    async getImage(@Param('path') path: string | string[], @Res() res: Response) {
        // Validation: If path comes as array, join it.
        const s3Path = Array.isArray(path) ? path.join('/') : path;

        this.logger.log(`Requesting path: ${s3Path}`);
        if (!s3Path) throw new NotFoundException('Path not provided');

        // path comes in as 'brands/tata' or 'nexon/nexon-main'
        // We need to try extensions: .png, .jpg, .jpeg

        const extensions = ['.png', '.jpg', '.jpeg', '.webp'];

        for (const ext of extensions) {
            const key = `${s3Path}${ext}`;
            try {
                const command = new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                });

                const response = await this.s3Client.send(command);

                // Found it! Stream it back.
                if (response.Body instanceof Readable) {
                    res.set({
                        'Content-Type': response.ContentType || 'image/jpeg',
                        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
                    });
                    response.Body.pipe(res);
                    return;
                }
            } catch (error: any) {
                // If 404/NoSuchKey, continue to next extension
                if (error.name !== 'NoSuchKey' && error.$metadata?.httpStatusCode !== 404) {
                    this.logger.error(`Error fetching ${key}: ${error.message}`);
                }
            }
        }

        // If loop finishes without returning, image was not found
        throw new NotFoundException(`Image not found: ${s3Path}`);
    }
}
