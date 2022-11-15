export const isProd = !process.env.NODE_ENV || process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
export const isDev = process.env.NODE_ENV === 'development';
export const isCI = process.env.CI === 'true';

