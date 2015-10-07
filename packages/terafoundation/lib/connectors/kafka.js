'use strict';

var _ = require('lodash');
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
            zookeepers: "localhost:2181",
            clientId: "terafoundation"
        };

        _.merge(config, customConfig);

        logger.info("Using kafka zookeepers: " + config.zookeepers);

        var kafka = require('kafka-node');

        var client = kafka.Client(config.zookeepers, config.clientId);
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