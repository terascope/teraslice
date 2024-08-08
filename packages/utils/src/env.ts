import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

export const isProd = !process.env.NODE_ENV || process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
export const isDev = process.env.NODE_ENV === 'development';
export const isCI = process.env.CI === 'true';

export function isExecutedFile(url: string): boolean {
    if (url.startsWith('file:')) {
        const modulePath = fileURLToPath(url);
        const mainPath = fs.realpathSync(process.argv[1]);
        return mainPath === modulePath;
    }
    return false;
}
