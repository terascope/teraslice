import { SchemaValidator } from '@terascope/core-utils';
import { OpenSearchTestEnv, Terafoundation } from '@terascope/types';

const opensearchEnvSchema: Terafoundation.Schema<any> = {
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

export {
    envConfig
};
