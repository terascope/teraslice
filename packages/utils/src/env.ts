const { NODE_ENV = 'production' } = process.env;

export const isProd = NODE_ENV === 'production';
export const isTest = NODE_ENV === 'test';
export const isDev = NODE_ENV === 'development';
export const isCI = process.env.CI === 'true';
