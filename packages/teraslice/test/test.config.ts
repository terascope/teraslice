import fs from 'node:fs';
import path from 'node:path';
import { TerasliceEnv } from '@terascope/types';
import { SchemaValidator } from '@terascope/core-utils';
import { newId } from '../src/lib/utils/id_utils.js';

const terasliceTestEnvSchema = {
    SEARCH_TEST_HOST: {
        default: undefined,
        format: String,
    },
    TERASLICE_CLUSTER_NAME: {
        default: null,
        format: 'optional_string',
    },
    TEST_INDEX_PREFIX: {
        default: undefined,
        format: String,
    },
};

const validator = new SchemaValidator<TerasliceEnv>(
    terasliceTestEnvSchema,
    'terasliceTestEnvSchema',
    undefined,
    'allow'
);

const envConfig = validator.validate(process.env);

const { SEARCH_TEST_HOST, TEST_INDEX_PREFIX } = envConfig;

const TERASLICE_CLUSTER_NAME = envConfig.TERASLICE_CLUSTER_NAME
    || newId(`${TEST_INDEX_PREFIX}teraslice`, true, 2);

const ENCRYPT_CEPH = process.env.ENCRYPT_CEPH === 'true';

if (ENCRYPT_CEPH && !process.env.CERT_PATH) {
    throw new Error('ENCRYPT_CEPH is set but CERT_PATH is not, so the root CA cannot be found');
}

const S3_CONNECTOR_CONFIG = {
    endpoint: process.env.CEPH_HOST,
    accessKeyId: process.env.CEPH_ACCESS_KEY,
    secretAccessKey: process.env.CEPH_SECRET_KEY,
    forcePathStyle: true,
    sslEnabled: ENCRYPT_CEPH,
    region: 'us-east-1',
    ...(ENCRYPT_CEPH && {
        caCertificate: fs.readFileSync(
            path.join(process.env.CERT_PATH as string, 'CAs', 'rootCA.pem'), 'utf8'
        )
    })
};

export {
    TEST_INDEX_PREFIX,
    SEARCH_TEST_HOST,
    TERASLICE_CLUSTER_NAME,
    S3_CONNECTOR_CONFIG,
};
