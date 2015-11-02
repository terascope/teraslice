'use strict';

var events = require('events');

function init_events(client) {
    var conn_events = new events.EventEmitter();

   /* client.socket.on('error', function(error) {
        conn_events.emit('error', error);
    });*/

    return conn_events;
}

function create(customConfig, logger) {
    var StatsD = require('node-statsd').StatsD;

    logger.info("Using statsd host: " + customConfig.host);

    var client = new StatsD(customConfig);

    return {
        client: client,
        events: init_events(client)
    }
}

function config_schema() {
    return {
        host: {
            doc: '',
            default: '127.0.0.1'
        },
        mock: {
            doc: '',
            default: false
        }
    }
}

module.exports = {
    create: create,
    config_schema: config_schema

};