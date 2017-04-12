'use strict';

var Promise = require('bluebird');
var Agent = require('./elastic_helpers');

function logWrapper(logger) {

    return function() {
        this.error = logger.error.bind(logger);
        this.warning = logger.warn.bind(logger);
        this.info = logger.info.bind(logger);
        this.debug = logger.debug.bind(logger);
        this.trace = function(method, requestUrl, body, responseBody, responseStatus) {
            logger.trace({
                method: method,
                requestUrl: requestUrl,
                body: body,
                responseBody: responseBody,
                responseStatus: responseStatus
            });
        };
        this.close = function() {
        };
    }
}

function create(customConfig, logger) {
    var elasticsearch = require('elasticsearch');

    logger.info("Using elasticsearch hosts: " + customConfig.host);

    customConfig.connectionClass = Agent;
    customConfig.defer = function () {
        return Promise.defer();
    };
    var client = new elasticsearch.Client(customConfig);

    return {
        client: client,
        log: logWrapper(logger)
    }
}

function config_schema() {
    return {
        host: {
            doc: '',
            default: ["127.0.0.1:9200"]
        },
        sniffOnStart: {
            doc: '',
            default: false
        },
        sniffOnConnectionFault: {
            doc: '',
            default: false
        },
        requestTimeout: {
            doc: '',
            default: 120000
        },
        deadTimeout: {
            doc: '',
            default: 30000
        },
        maxRetries: {
            doc: '',
            default: 3
        }
    }
}

module.exports = {
    create: create,
    config_schema: config_schema
};
