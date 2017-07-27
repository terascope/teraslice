'use strict';


function getOpConfig(job, name) {
    return job.operations.find(function(op) {
        return op._op === name;
    })
}

function getClient(context, config, type) {
    var clientConfig = {};
    var events = context.foundation.getEventEmitter();
    clientConfig.type = type;

    if (config && config.hasOwnProperty('connection')) {
        clientConfig.endpoint = config.connection ? config.connection : 'default';
        clientConfig.cached = config.connection_cache !== undefined ? config.connection_cache : true;

    }
    else {
        clientConfig.endpoint = 'default';
        clientConfig.cached = true;
    }
    try {
        return context.foundation.getConnection(clientConfig).client;
    }
    catch (err) {
        var errMsg = `No configuration for endpoint ${clientConfig.endpoint} was found in the terafoundation connectors config, error: ${err.stack}`;
        context.logger.error(errMsg);
        events.emit('getClient:config_error', {err: errMsg})
    }
}


module.exports = {
    getClient: getClient,
    getOpConfig: getOpConfig
};