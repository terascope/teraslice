import { z } from 'zod';

const sharedEnvSchema = z.object({
    SEARCH_TEST_HOST: z.string(),
    TEST_INDEX_PREFIX: z.string(),
});

const opensearchEnvSchema = sharedEnvSchema.extend({
    OPENSEARCH_PASSWORD: z.string(),
    OPENSEARCH_USER: z.string(),
    OPENSEARCH_VERSION: z.string(),
});

const elasticsearchEnvSchema = sharedEnvSchema.extend(
    {
        ELASTICSEARCH_VERSION: z.string()
    }
);

export {
    elasticsearchEnvSchema,
    opensearchEnvSchema,
    sharedEnvSchema,
};
