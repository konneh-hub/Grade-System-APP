const requiredEnv = ['JWT_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is required and must be set in environment variables`);
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const NODE_ENV = process.env.NODE_ENV || 'development';
const COOKIE_DEFAULT_MAX_AGE = Number(process.env.SESSION_MAX_AGE ?? 60 * 60 * 24); // 1 day
const COOKIE_REMEMBER_ME_MAX_AGE = Number(process.env.SESSION_REMEMBER_ME_MAX_AGE ?? 60 * 60 * 24 * 30); // 30 days
const COOKIE_SECURE = NODE_ENV === 'production';

export const config = {
  JWT_SECRET,
  COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'slughub_session',
  COOKIE_MAX_AGE: COOKIE_DEFAULT_MAX_AGE,
  COOKIE_DEFAULT_MAX_AGE,
  COOKIE_REMEMBER_ME_MAX_AGE,
  COOKIE_SECURE,
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
};

export default config;
