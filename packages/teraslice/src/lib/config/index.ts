import path from 'node:path';
import { get } from '@terascope/utils';
import { formats, TerasliceConfig, SysConfig } from '@terascope/job-components';
import { configSchema } from './schemas/system';

export const terasliceOpPath = path.join(__dirname, '..');

export function clusterName(configFile: TerasliceConfig) {
    return get(configFile, 'teraslice.name', null);
}

export function getTerasliceConfig(sysconfig: SysConfig) {
    return Object.assign({
        name: 'teraslice',
        default_config_file: path.join(__dirname, 'default-sysconfig.js'),
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
