'use strict';

var _ = require('lodash');
var events = require('events');

module.exports = function(context) {
    var logger = context.logger;

    function init_events(client) {
        var conn_events = new events.EventEmitter();

        client.connection.on('error', function (err) {
            conn_events.emit('error', error);
        });

        client.connection.on('reconnected', function () {
            conn_events.emit('reconnected', error);
        });

        return conn_events;
    }

    function create(customConfig) {
        var mongoose = require("mongoose");

        // TODO: rework configuration to allow incoming config to be a full mongo config
        var config = {
            servers: "mongodb://localhost:27017/test"
        };

        _.merge(config, customConfig);

        logger.info("Using mongo connection string: " + config.servers);

        var serverConfig = {
            server: {
                auto_reconnect: true,
                socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}
            }
        };

        if (config.replicaSet) {
            serverConfig.replset = {
                rs_name: config.replicaSet,
                socketOptions: {
                    keepAlive: 1,
                    connectTimeoutMS: config.replicaSetTimeout
                },
                readPreference: 'secondaryPreferred'
            };
        }

        mongoose.connect(config.servers, serverConfig, function (error) {
            if (error) {
                logger.error("Could not connect to Mongo DB: " + error);
            }
        });

        return {
            client: mongoose,
            events: init_events(mongoose)
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