export const config = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'slughub_session',
  COOKIE_MAX_AGE: Number(process.env.SESSION_MAX_AGE || 60 * 60 * 24 * 7), // seconds
};

export default config;
