import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as https from 'https';

@Injectable()
export class AEStorageService {
  private readonly logger = new Logger(AEStorageService.name);
  private endpoint = (process.env.SPACES_ENDPOINT || 'https://sfo3.digitaloceanspaces.com').replace(/\/$/, '');
  private bucketName = process.env.SPACES_BUCKET_NAME || 'osisg-play';
  private region = process.env.SPACES_REGION || 'sfo3';
  private accessKey = process.env.SPACES_KEY || 'DO801WZLZBR2HW6H83UM';
  private secretKey = process.env.SPACES_SECRET || '2oIJDLRRCkiXin3+NMbaaPIA7QKRIV+b4QSl89hDDqE';

  /**
   * Uploads a base64 string or binary buffer to DigitalOcean Spaces (S3 compatible)
   */
  async uploadBase64OrBuffer(
    input: string | Buffer,
    originalName = 'image.jpg',
    defaultMimeType = 'image/jpeg',
    folder: 'cvs' | 'photos' | 'avatars' = 'photos',
  ): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
    let buffer: Buffer;
    let mimeType = defaultMimeType;
    const fileName = originalName;

    if (typeof input === 'string') {
      if (input.startsWith('data:')) {
        const matches = input.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(input, 'base64');
        }
      } else if (input.startsWith('http://') || input.startsWith('https://')) {
        // Already a remote URL
        return { url: input, fileName, fileSize: 0, mimeType };
      } else {
        buffer = Buffer.from(input, 'base64');
      }
    } else {
      buffer = input;
    }

    const extFromMime = mimeType.split('/')[1] || 'jpg';
    const extFromName = fileName.includes('.') ? fileName.split('.').pop() : '';
    const ext = extFromName || extFromMime || 'jpg';
    const cleanExt = (ext === 'jpeg' ? 'jpg' : ext).replace(/[^a-zA-Z0-9]/g, '');
    const uniqueKey = `${folder}/${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${cleanExt}`;

    const uploadedUrl = await this.putToSpaces(uniqueKey, buffer, mimeType);

    return {
      url: uploadedUrl,
      fileName,
      fileSize: buffer.length,
      mimeType,
    };
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: 'cvs' | 'photos' | 'avatars' = 'photos',
  ): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
    return this.uploadBase64OrBuffer(fileBuffer, originalName, mimeType, folder);
  }

  private async putToSpaces(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const host = `${this.bucketName}.${this.region}.digitaloceanspaces.com`;
    const path = `/${key}`;
    const publicUrl = `https://${host}${path}`;

    if (!this.accessKey || !this.secretKey) {
      this.logger.warn('Spaces credentials not configured, returning standard bucket URL');
      return publicUrl;
    }

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
    const dateStamp = amzDate.substring(0, 8); // YYYYMMDD

    const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Canonical Headers (must be lowercased and sorted alphabetically)
    const canonicalHeaders =
      `content-length:${buffer.length}\n` +
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-acl:public-read\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = 'content-length;content-type;host;x-amz-acl;x-amz-content-sha256;x-amz-date';

    // Canonical Request
    const canonicalRequest =
      `PUT\n` +
      `${path}\n` +
      `\n` + // query string (empty)
      `${canonicalHeaders}\n` +
      `${signedHeaders}\n` +
      `${payloadHash}`;

    // String to Sign
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign =
      `AWS4-HMAC-SHA256\n` +
      `${amzDate}\n` +
      `${credentialScope}\n` +
      `${hashedCanonicalRequest}`;

    // Calculate Signature via HMAC-SHA256
    const kDate = crypto.createHmac('sha256', `AWS4${this.secretKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return new Promise<string>((resolve, reject) => {
      const options = {
        hostname: host,
        port: 443,
        path: path,
        method: 'PUT',
        headers: {
          'Content-Length': buffer.length,
          'Content-Type': contentType,
          'Host': host,
          'x-amz-acl': 'public-read',
          'x-amz-content-sha256': payloadHash,
          'x-amz-date': amzDate,
          'Authorization': authorizationHeader,
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            this.logger.log(`Uploaded file successfully to DigitalOcean Spaces: ${publicUrl}`);
            resolve(publicUrl);
          } else {
            this.logger.error(`Spaces upload failed with status ${res.statusCode}: ${responseBody}`);
            reject(new Error(`Error al subir imagen a DigitalOcean Spaces: status ${res.statusCode} - ${responseBody}`));
          }
        });
      });

      req.on('error', (err) => {
        this.logger.error(`Network error uploading to Spaces: ${err.message}`);
        reject(err);
      });

      req.write(buffer);
      req.end();
    });
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    this.logger.log(`File deletion requested: ${fileUrl.substring(0, 50)}...`);
    return true;
  }
}
