'use strict';

var events = require('events');

function create(customConfig, logger) {
    var mongoose = require("mongoose");
    // TODO: rework configuration to allow incoming config to be a full mongo config
    logger.info("Using mongo connection string: " + customConfig.servers);

    var serverConfig = {
        server: {
            auto_reconnect: true,
            socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}
        }
    };

    if (customConfig.replicaSet) {
        serverConfig.replset = {
            rs_name: customConfig.replicaSet,
            socketOptions: {
                keepAlive: 1,
                connectTimeoutMS: customConfig.replicaSetTimeout
            },
            readPreference: 'secondaryPreferred'
        };
    }

    mongoose.connect(customConfig.servers, serverConfig, function(error) {
        if (error) {
            logger.error("Could not connect to Mongo DB: " + error);
        }
    });

    return {
        client: mongoose
    }
}

function config_schema() {
    return {
        servers: {
            doc: '',
            default: "mongodb://localhost:27017/test"
        }
    }
}

module.exports = {
    create: create,
    config_schema: config_schema
};