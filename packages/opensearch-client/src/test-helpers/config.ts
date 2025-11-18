import { z } from 'zod';

const opensearchEnvSchema = z.object({
    ELASTICSEARCH_HOST: z.string(),
    ELASTICSEARCH_VERSION: z.string(),
    OPENSEARCH_HOST: z.string(),
    OPENSEARCH_PASSWORD: z.string(),
    OPENSEARCH_SSL_HOST: z.string(),
    OPENSEARCH_USER: z.string(),
    OPENSEARCH_VERSION: z.string(),
    RESTRAINED_OPENSEARCH_HOST: z.string(),
    SEARCH_TEST_HOST: z.string(),
    TEST_INDEX_PREFIX: z.string(),
});

export {
    opensearchEnvSchema
};
