'use strict';

var _ = require('lodash');
var events = require('events');

module.exports = function(context) {
    var logger = context.logger;

    function init_events(client) {
        var conn_events = new events.EventEmitter();

        client.socket.on('error', function(error) {
            conn_events.emit('error', error);
        });

        return conn_events;
    }

    function create(customConfig) {
        var StatsD = require('node-statsd').StatsD;

        var config = {
            host: '127.0.0.1',
            mock: false
        };

        _.merge(config, customConfig);

        logger.info("Using statsd host: " + config.host);

        var client = new StatsD(config);

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
};