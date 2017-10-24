'use strict';

// FIXME: this function is deprecated. Replaced by the context API op_runner.getOpConfig
// Should be removed prior to 1.0
function getOpConfig(job, name) {
    return job.operations.find(op => op._op === name);
}

// FIXME: this function is deprecated. Replaced by the context API op_runner.getClient
// Should be removed prior to 1.0
function getClient(context, config, type) {
    const clientConfig = {};
    const events = context.foundation.getEventEmitter();
    clientConfig.type = type;

    if (config && config.hasOwnProperty('connection')) {
        clientConfig.endpoint = config.connection ? config.connection : 'default';
        clientConfig.cached = config.connection_cache !== undefined ? config.connection_cache : true;
    } else {
        clientConfig.endpoint = 'default';
        clientConfig.cached = true;
    }
    try {
        return context.foundation.getConnection(clientConfig).client;
    } catch (err) {
        const errMsg = `No configuration for endpoint ${clientConfig.endpoint} was found in the terafoundation connectors config, error: ${err.stack}`;
        context.logger.error(errMsg);
        events.emit('getClient:config_error', { err: errMsg });
    }
}


module.exports = {
    getClient,
    getOpConfig
};
