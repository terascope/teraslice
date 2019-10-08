import { Logger } from '@terascope/utils';

function create(customConfig: any, logger: Logger) {
    const redis = require('redis');

    logger.info(`Using redis host: ${customConfig.host}`);

    const client = redis.createClient(customConfig.port, customConfig.host);

    return {
        client
    };
}

export default {
    create,
    config_schema() {
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
