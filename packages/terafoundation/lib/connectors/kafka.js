'use strict';

var _ = require('lodash');

module.exports = function (customConfig, logger) {
    var config = {
        zookeepers: "localhost:2181",
        clientId: "terafoundation"
    };

    _.merge(config, customConfig);

    logger.info("Using kafka zookeepers: " + config.zookeepers);

    var kafka = require('kafka-node');

    return new kafka.Client(config.zookeepers, config.clientId);
};
