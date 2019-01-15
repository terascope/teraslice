'use strict';

const redis = require('redis');

function create(customConfig, logger) {
    logger.info(`Using redis host: ${customConfig.host}`);

    const client = redis.createClient(customConfig.port, customConfig.host);

    return {
        client
    };
}

module.exports = {
    create,
    config_schema: {
        host: {
            doc: '',
            default: '127.0.0.1'
        },
        port: {
            doc: '',
            default: 6379
        }
    }
};
