'use strict';

function create(customConfig, logger) {
    const { StatsD } = require('node-statsd');
    logger.info(`Using statsd host: ${customConfig.host}`);

    const client = new StatsD(customConfig);

    return {
        client
    };
}

module.exports = {
    create,
    config_schema() {
        return {
            host: {
                doc: '',
                default: '127.0.0.1'
            },
            mock: {
                doc: '',
                default: false
            }
        };
    }
};
