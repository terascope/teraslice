'use strict';

var events = require('events');

function init_events(client) {
    var conn_events = new events.EventEmitter();

    client.on('error', function(error) {
        conn_events.emit('error', error);
    });

    return conn_events;
}

function create(customConfig, logger) {

    logger.info("Using kafka zookeepers: " + customConfig.zookeepers);

    var kafka = require('kafka-node');

    var client = kafka.Client(customConfig.zookeepers, customConfig.clientId);

    return {
        client: client,
        events: init_events(client)
    }
}

function config_schema() {
    return {
        zookeepers: {
            doc: '',
            default: "localhost:2181"
        },
        clientId: {
            doc: '',
            default: "terafoundation"
        }
    }
}

module.exports = {
    create: create,
    config_schema: config_schema
};