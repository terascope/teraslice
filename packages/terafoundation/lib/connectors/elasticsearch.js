'use strict';

var events = require('events');

function init_events(client) {
    var conn_events = new events.EventEmitter();

    /*client.on('error', function(error) {
     conn_events.emit('error', error);
     });*/

    return conn_events;
}

function create(customConfig, logger) {
    var elasticsearch = require('elasticsearch');

    logger.info("Using elasticsearch hosts: " + customConfig.host);

    // TODO: there's no error handling here at all???
    var client = new elasticsearch.Client(customConfig);

    return {
        client: client,
        events: init_events(client)
    }
}

function config_schema() {
    return {
        host: {
            doc: '',
            default: ["127.0.0.1:9200"]
        },
        sniffOnStart: {
            doc: '',
            default: false
        },
        sniffOnConnectionFault: {
            doc: '',
            default: false
        },
        requestTimeout: {
            doc: '',
            default: 120000
        },
        deadTimeout: {
            doc: '',
            default: 30000
        },
        maxRetries: {
            doc: '',
            default: 3
        }
    }
}

module.exports = {
    create: create,
    config_schema: config_schema
};