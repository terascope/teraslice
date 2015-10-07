'use strict';

var _ = require('lodash');
var events = require('events');

module.exports = function(context) {
    var logger = context.logger;

    function init_events(client) {
        var conn_events = new events.EventEmitter();

        /*client.on('error', function(error) {
            conn_events.emit('error', error);
        });*/

        return conn_events;
    }

    function create(customConfig) {
        var elasticsearch = require('elasticsearch');

        /* Common defaults, can be over-ridden by user provided config */
        var config = {
            host: ["127.0.0.1:9200"],
            sniffOnStart: false,
            sniffInterval: 30000,
            sniffOnConnectionFault: false,
            requestTimeout: 120000,
            deadTimeout: 30000,
            maxRetries: 3
        };


        _.merge(config, customConfig);

        logger.info("Using elasticsearch hosts: " + config.host);

        // TODO: there's no error handling here at all???
        var client = new elasticsearch.Client(config);

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