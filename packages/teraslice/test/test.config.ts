import { z } from 'zod';
import { TerasliceEnv } from '@terascope/types';
import { newId } from '../src/lib/utils/id_utils.js';

const terasliceTestEnvSchema = z.object({
    SEARCH_TEST_HOST: z.string(),
    TERASLICE_CLUSTER_NAME: z.string().optional(),
    TEST_INDEX_PREFIX: z.string(),
}) satisfies z.ZodType<TerasliceEnv>;

const envConfig = terasliceTestEnvSchema.parse(process.env);

const { SEARCH_TEST_HOST, TEST_INDEX_PREFIX } = envConfig;

const TERASLICE_CLUSTER_NAME = envConfig.TERASLICE_CLUSTER_NAME
    || newId(`${TEST_INDEX_PREFIX}teraslice`, true, 2);

export {
    TEST_INDEX_PREFIX,
    SEARCH_TEST_HOST,
    TERASLICE_CLUSTER_NAME,
};
