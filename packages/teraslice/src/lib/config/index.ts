import path from 'node:path';
import { get } from '@terascope/utils';
import { fileURLToPath } from 'node:url';
import { formats, TerasliceConfig } from '@terascope/job-components';
import type { FoundationConfig } from 'terafoundation';
import { configSchema } from './schemas/system.js';

const filePath = fileURLToPath(new URL('.', import.meta.url));
export const terasliceOpPath = path.join(filePath, '..');

export function clusterName(configFile: TerasliceConfig) {
    return get(configFile, 'teraslice.name', null);
}

export function getTerasliceConfig(sysconfig: FoundationConfig) {
    return Object.assign({
        name: 'teraslice',
        default_config_file: path.join(filePath, 'default-sysconfig.js'),
        config_schema: configSchema,
        schema_formats: formats,
        cluster_name: clusterName,
        shutdownMessaging: false,
        start_workers: false,
    }, sysconfig);
}

export {
    formats,
    configSchema,
};
