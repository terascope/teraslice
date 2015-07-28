'use strict';

var _ = require('lodash');

module.exports = function (customConfig, logger) {
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

    return client;
};
