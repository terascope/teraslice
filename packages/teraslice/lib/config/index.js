import path from 'path';
import { get } from '@terascope/utils';
import { formats } from '@terascope/job-components';
import { configSchema } from './schemas/system.js';

const terasliceOpPath = path.join(__dirname, '..');

function clusterName(configFile) {
    return get(configFile, 'teraslice.name', null);
}

function getTerasliceConfig(sysconfig) {
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

export default {
    terasliceOpPath,
    formats,
    configSchema,
    getTerasliceConfig,
    clusterName,
};
