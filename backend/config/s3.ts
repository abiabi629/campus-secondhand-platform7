import { S3Client } from '@aws-sdk/client-s3';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Only require AWS credentials in production
if (!isDevelopment) {
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS credentials not configured:', {
      AWS_REGION: process.env.AWS_REGION ? 'set' : 'missing',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'set' : 'missing',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'missing',
    });
    throw new Error(
      'AWS credentials are required. Please set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.'
    );
  }
} else {
  console.warn('Running in development mode - AWS credentials not required');
}

// Create S3 client with credentials if available, otherwise use default (for development)
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

export const S3_CONFIG = {
  BUCKET_NAME: process.env.BUCKET_NAME || 'dev-bucket',
  REGION: process.env.AWS_REGION || 'us-east-1',
  FOLDER_PREFIX: 'user-content',
  PRESIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
} as const;
