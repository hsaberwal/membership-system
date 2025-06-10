import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '5432'),
    NAME: process.env.DB_NAME || 'membership',
    USER: process.env.DB_USER || 'membership_user',
    PASSWORD: process.env.DB_PASSWORD || '',
  },
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  
  // Redis
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT || '6379'),
  },
  
  // File Upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  
  // External APIs
  LOQATE_API_KEY: process.env.LOQATE_API_KEY || '',
  SMARTSEARCH_API_KEY: process.env.SMARTSEARCH_API_KEY || '',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
