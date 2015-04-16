'use strict';

var _ = require('lodash');

module.exports = function(customConfig, logger) {
    var mongoose = require("mongoose");

    // TODO: rework configuration to allow incoming config to be a full mongo config
    var config = {
        servers: "mongodb://localhost:27017/test"
    }

    _.merge(config, customConfig);
    
    logger.info("Using mongo connection string: " + config.servers);

    var serverConfig = {
        server: {
            auto_reconnect: true,
            socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 }
        }
    };

    if (config.replicaSet) {
        serverConfig.replset = {
            rs_name: config.replicaSet,
            socketOptions: {
                keepAlive: 1,
                connectTimeoutMS : config.replicaSetTimeout
            },
            readPreference: 'secondaryPreferred'
        };
    }

    mongoose.connect(config.servers, serverConfig, function(error) {
        if (error) {
            logger.error("Could not connect to Mongo DB: " + error);
        }
    });

    mongoose.connection.on('error', function(err) {
        logger.error("Error from mongodb: " + err);
    });

    mongoose.connection.on('reconnected', function () {
        logger.error('Error: mongo connection dropped. Automatically reconnected.');
    });

    return mongoose;
}
