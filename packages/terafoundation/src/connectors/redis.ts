import { Logger } from '@terascope/utils';
import * as redis from 'redis';

const { createClient: redisCreateClient } = redis;

function create(customConfig: Record<string, any>, logger: Logger): {
    client: any;
} {
    logger.info(`Using redis host: ${customConfig.host}`);
    const client = redisCreateClient({ url: `${customConfig.host}:${customConfig.port}`});

    return {
        client
    };
}

export default {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        return create(customConfig, logger);
    },
    config_schema(): Record<string, any> {
        return {
            host: {
                doc: '',
                default: '127.0.0.1'
            },
            port: {
                doc: '',
                default: 6379
            }
        };
    }
};
