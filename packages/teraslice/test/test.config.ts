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

export {
    TEST_INDEX_PREFIX,
    SEARCH_TEST_HOST,
    TERASLICE_CLUSTER_NAME,
};
