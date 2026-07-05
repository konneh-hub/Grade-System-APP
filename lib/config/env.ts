export const config = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'slughub_session',
  COOKIE_MAX_AGE: Number(process.env.SESSION_MAX_AGE || 60 * 60 * 24 * 7), // seconds
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
};

export default config;
