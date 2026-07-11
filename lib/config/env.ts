const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET.trim() === '')) {
  throw new Error('JWT_SECRET is required in production and must be supplied through secure environment variables');
}

export const config = {
  JWT_SECRET: JWT_SECRET || 'dev-secret-change-me',
  COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'slughub_session',
  COOKIE_MAX_AGE: Number(process.env.SESSION_MAX_AGE ?? 60 * 60 * 24 * 7), // seconds
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
};

export default config;
