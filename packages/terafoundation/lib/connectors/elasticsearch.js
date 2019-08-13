'use strict';

const Promise = require('bluebird');

function logWrapper(logger) {
    return function _wrap() {
        this.error = logger.error.bind(logger);
        this.warning = logger.warn.bind(logger);
        this.info = logger.info.bind(logger);
        this.debug = logger.debug.bind(logger);
        this.trace = function _trace(method, requestUrl, body, responseBody, responseStatus) {
            logger.trace({
                method,
                requestUrl,
                body,
                responseBody,
                responseStatus
            });
        };
        this.close = function _close() {};
    };
}

function create(customConfig, logger) {
    const elasticsearch = require('elasticsearch');

    logger.info(`using elasticsearch hosts: ${customConfig.host}`);

    customConfig.defer = function _defer() {
        return Promise.defer();
    };

    const client = new elasticsearch.Client(customConfig);

    return {
        client,
        log: logWrapper(logger)
    };
}

module.exports = {
    create,
    config_schema() {
        return {
            host: {
                doc: 'A list of hosts to connect to',
                default: ['127.0.0.1:9200']
            },
            sniffOnStart: {
                doc: 'Sniff hosts on start up',
                default: false
            },
            sniffOnConnectionFault: {
                doc: 'Sniff hosts on connection failure',
                default: false
            },
            apiVersion: {
                describe: 'The API version, currently we only support 5.6, 6.5 and 7.0',
                default: '6.5'
            },
            requestTimeout: {
                doc: 'Request timeout',
                default: 120000,
                format: 'duration'
            },
            deadTimeout: {
                doc: 'Timeout before marking a connection as "dead"',
                default: 30000,
                format: 'duration'
            },
            maxRetries: {
                doc: 'Maximum retries for a failed request',
                default: 3
            }
        };
    }
};
