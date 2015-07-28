'use strict';

var _ = require('lodash');
var redis = require('redis');

module.exports = function (customConfig, logger) {
    var config = {
        host: '127.0.0.1',
        port: 6379
    };

    _.merge(config, customConfig);

    logger.info("Using redis host: " + config.host);

    var client = redis.createClient(config.port, config.host);

    // Redis error handler
    client.on("error", function (err) {
        logger.error("Error " + err);
    });

    return client
};
