'use strict';

var _ = require('lodash');
var redis = require('redis');
var events = require('events');

module.exports = function(context) {
    var logger = context.logger;

    function init_events(client) {
        var conn_events = new events.EventEmitter();

        client.on('error', function(error) {
            conn_events.emit('error', error);
        });

        return conn_events;
    }

    function create(customConfig) {
        var config = {
            host: '127.0.0.1',
            port: 6379
        };

        _.merge(config, customConfig);

        logger.info("Using redis host: " + config.host);

        var client = redis.createClient(config.port, config.host);

        return {
            client: client,
            events: init_events(client)
        }
    }

    function config_schema() {
        return {

        }
    }

    return {
        create: create,
        config_schema: config_schema
    }
}

