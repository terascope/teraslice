import path from 'node:path';
import { SchemaValidator } from '@terascope/core-utils';
import { OpenSearchTestEnv, Terafoundation } from '@terascope/types';

const opensearchEnvSchema: Terafoundation.Schema<any> = {
    CERT_PATH: {
        default: undefined,
        format: String
    },
    OPENSEARCH_HOST: {
        default: null,
        format: 'optional_string',
    },
    OPENSEARCH_PASSWORD: {
        default: null,
        format: 'optional_string',
    },
    OPENSEARCH_SSL_HOST: {
        default: null,
        format: 'optional_string',
    },
    OPENSEARCH_USER: {
        default: null,
        format: 'optional_string',
    },
    OPENSEARCH_VERSION: {
        default: null,
        format: 'optional_string',
    },
    RESTRAINED_OPENSEARCH_HOST: {
        default: null,
        format: 'optional_string',
    },
    SEARCH_TEST_HOST: {
        default: undefined,
        format: String,
    },
    TEST_INDEX_PREFIX: {
        default: undefined,
        format: String,
    },
};

const validator = new SchemaValidator<OpenSearchTestEnv>(
    opensearchEnvSchema,
    'opensearchEnvSchema',
    undefined,
    'allow'
);
const envConfig = validator.validate(process.env);

const rootCertPath = envConfig.CERT_PATH ? path.join(envConfig.CERT_PATH, 'CAs/rootCA.pem') : '';

export const config: OpensearchTestConfig = {
    ...envConfig,
    ROOT_CERT_PATH: rootCertPath,
};

type OpensearchTestConfig = OpenSearchTestEnv & { ROOT_CERT_PATH: string };
