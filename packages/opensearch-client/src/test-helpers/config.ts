import { z } from 'zod';

const opensearchEnvSchema = z.object({
    ELASTICSEARCH_HOST: z.string().optional(),
    ELASTICSEARCH_VERSION: z.string().optional(),
    OPENSEARCH_HOST: z.string().optional(),
    OPENSEARCH_PASSWORD: z.string().optional(),
    OPENSEARCH_SSL_HOST: z.string().optional(),
    OPENSEARCH_USER: z.string().optional(),
    OPENSEARCH_VERSION: z.string().optional(),
    RESTRAINED_OPENSEARCH_HOST: z.string().optional(),
    SEARCH_TEST_HOST: z.string(),
    TEST_INDEX_PREFIX: z.string(),
});

export {
    opensearchEnvSchema
};
