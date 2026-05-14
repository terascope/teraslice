import { SchemaValidator } from '@terascope/core-utils';
import { Terafoundation, ValkeyTestEnv } from '@terascope/types';

const valkeyEnvSchema: Terafoundation.Schema<ValkeyTestEnv> = {
    VALKEY_HOSTNAME: {
        default: null,
        format: String
    },
    VALKEY_PORT: {
        default: null,
        format: 'port'
    }
};

const validator = new SchemaValidator<ValkeyTestEnv>(
    valkeyEnvSchema,
    'valkeyEnvSchema',
    undefined,
    'allow'
);
export const valkeyTestConfig = validator.validate(process.env);
