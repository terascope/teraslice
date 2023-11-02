import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error
import barbe from 'barbe';
import { isTest } from '@terascope/utils';

const MAX_RETRIES = isTest ? 2 : 3;
const RETRY_DELAY = isTest ? 50 : 1000; // time in ms

export function makeTemplate(folder: string, fileName: string) {
    const filePath = path.join(__dirname, folder, `${fileName}.hbs`);
    const templateData = fs.readFileSync(filePath, 'utf-8');
    const templateKeys = ['{{', '}}'];

    return (config: any) => {
        const templated = barbe(templateData, templateKeys, config);
        return JSON.parse(templated);
    };
}

// Convert bytes to MB and reduce by 10%
export function getMaxOldSpace(memory: number) {
    return Math.round(0.9 * (memory / 1024 / 1024));
}

interface EnvObject {
    name: string;
    value: any;
}

export function setMaxOldSpaceViaEnv(
    envArr: EnvObject[],
    jobEnv: Record<string, any>,
    memory: number
) {
    const envObj: Record<string, any> = {};
    if (memory && memory > -1) {
        // Set NODE_OPTIONS to override max-old-space-size
        const maxOldSpace = getMaxOldSpace(memory);
        envObj.NODE_OPTIONS = `--max-old-space-size=${maxOldSpace}`;
    }

    Object.assign(envObj, jobEnv);

    Object.entries(envObj).forEach(([name, value]) => {
        envArr.push({
            name,
            value
        });
    });
}

export function getRetryConfig() {
    return {
        retries: MAX_RETRIES,
        delay: RETRY_DELAY
    };
}
