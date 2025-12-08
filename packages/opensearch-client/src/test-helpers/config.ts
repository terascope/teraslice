import { SchemaValidator } from '@terascope/core-utils';
import { ElasticsearchTestEnv, OpenSearchTestEnv, Terafoundation } from '@terascope/types';

const opensearchEnvSchema: Terafoundation.Schema<any> = {
    ELASTICSEARCH_HOST: {
        default: null,
        format: 'optional_String',
    },
    ELASTICSEARCH_VERSION: {
        default: null,
        format: 'optional_String',
    },
    OPENSEARCH_HOST: {
        default: null,
        format: 'optional_String',
    },
    OPENSEARCH_PASSWORD: {
        default: null,
        format: 'optional_String',
    },
    OPENSEARCH_SSL_HOST: {
        default: null,
        format: 'optional_String',
    },
    OPENSEARCH_USER: {
        default: null,
        format: 'optional_String',
    },
    OPENSEARCH_VERSION: {
        default: null,
        format: 'optional_String',
    },
    RESTRAINED_OPENSEARCH_HOST: {
        default: null,
        format: 'optional_String',
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

const validator = new SchemaValidator<OpenSearchTestEnv | ElasticsearchTestEnv>(opensearchEnvSchema, 'opensearchEnvSchema');
const envConfig = validator.validate(process.env);

export {
    envConfig
};
