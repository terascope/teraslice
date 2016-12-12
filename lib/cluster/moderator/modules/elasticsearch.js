'use strict';
var getClient = require('../../../utils/config').getClient;
var Promise = require('bluebird');
var _ = require('lodash');


module.exports = function(context, logger) {
    var clients = collectClient(context);
    var state = {};
    var keyDict = {index: true, search: true, get: true, bulk: true};

    function collectClient(context) {
        let clientState = [];

        _.forOwn(context.sysconfig.terafoundation.connectors.elasticsearch, function(val, key) {
            let client = getClient(context, {connection: key}, 'elasticsearch');
            client.__esConnection = key;
            clientState.push(client)
        });

        return clientState
    }

    function check_service() {
        let throttleJobs = [];

        return Promise.map(clients, function(client) {
            return client.nodes.stats()
                .then(function(results) {
                    _.forOwn(results.nodes, function(stats, nodeName) {
                        if (state[nodeName]) {
                            _.forOwn(stats.thread_pool, function(val, key) {
                                if (state[nodeName][key]) {
                                    let threshold = state[nodeName][key].threshold;
                                    let queue = val.queue;

                                    //TODO make this a config option
                                    if (queue / threshold > 0.85) {
                                        throttleJobs.push({
                                            nodeName: nodeName,
                                            thread_pool: key,
                                            rate: `${queue}/${threshold}`
                                        })
                                    }
                                }
                            })
                        }
                        else {
                            //TODO need to decide what to do
                        }
                    });
                    throttleJobs.push({
                        connection: client.__esConnection,
                        nodeName: 'ehhlp',
                        thread_pool: 'bulk',
                        rate: '123/125'
                    });
                    return true;
                })
                .catch(function(err) {
                    logger.error(err)
                })
        })
            .then(function() {
                console.log('getting here', throttleJobs);
                return throttleJobs
            })
            .catch(function(err) {
                logger.error('check service error', err)
            })
    }

    //TODO need to handle when clients are not available
    function initialize() {
        return Promise.map(clients, function(client) {
            return client.nodes.info()
                .then(function(results) {
                    _.forOwn(results.nodes, function(stats, nodeName) {
                        if (!state[nodeName]) {
                            state[nodeName] = {};
                        }
                        _.forOwn(stats.thread_pool, function(val, key) {
                            if (keyDict[key]) {
                                if (!state[nodeName][key]) {
                                    state[nodeName][key] = {};
                                }
                                state[nodeName][key].threshold = val;
                            }
                        })
                    });

                    // console.log(state)
                })
                .catch(function(err) {
                    logger.error(err)
                });
        })
            .catch(function(err) {
                console.log('this is the outer error', err.stack);
            })

    }

    return {
        initialize: initialize,
        check_service: check_service
    }
};