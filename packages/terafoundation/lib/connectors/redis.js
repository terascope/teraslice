'use strict';

var _ = require('lodash');
var redis = require('redis');
var events = require('events');


function init_events(client) {
    var conn_events = new events.EventEmitter();

    client.on('error', function(error) {
        conn_events.emit('error', error);
    });

    return conn_events;
}


function create(customConfig, logger) {

    logger.info("Using redis host: " + customConfig.host);

    var client = redis.createClient(customConfig.port, customConfig.host);

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
        port: {
            doc: '',
            default: 6379
        }
    }
}

module.exports = {
    create: create,
    config_schema: config_schema
};

