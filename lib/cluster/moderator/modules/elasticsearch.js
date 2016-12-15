'use strict';
var getClient = require('../../../utils/config').getClient;
var Promise = require('bluebird');
var _ = require('lodash');


module.exports = function(context, logger) {
    //list of queue's to pay attention to
    var keyDict = {index: true, search: true, get: true, bulk: true};

    var state = {};

    var clients = collectClient(context);


    //makes client for all elasticsearch connections listed in system configuration
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
        let resumeJobs = [];

        return Promise.map(clients, function(client) {
            return client.nodes.stats()
                .then(function(results) {
                    _.forOwn(results.nodes, function(stats, node_name) {
                        if (state[node_name]) {
                            _.forOwn(stats.thread_pool, function(val, key) {
                                if (state[node_name][key]) {
                                    let threshold = state[node_name][key].threshold;
                                    let queue = val.queue;

                                    //TODO make this a config option
                                    if (queue / threshold >= 0.85) {
                                        state[node_name][key].throttle = true;
                                        throttleJobs.push({
                                            type: 'elasticsearch',
                                            connection: client.__esConnection,
                                            node_name: node_name,
                                            thread_pool: key,
                                            rate: `${queue}/${threshold}`
                                        })
                                    }

                                    //TODO make this a config option
                                    if (queue / threshold < 0.5 && state[node_name][key].throttle) {
                                        state[node_name][key].throttle = false;
                                        resumeJobs.push({
                                            type: 'elasticsearch',
                                            connection: client.__esConnection,
                                            nodeName: node_name,
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

                    return true;
                })
                .catch(function(err) {
                    //TODO flesh this out
                    logger.error(err)
                })
        })
            .then(function() {
                let results = {pause: null, resume: null};

                if (throttleJobs.length > 0) {
                    results.pause = _.uniqBy(throttleJobs, 'connection');
                }
                if (resumeJobs.length > 0) {
                    results.resume = _.uniqBy(resumeJobs, 'connection');
                }
                return results
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
                        _.forOwn(stats.thread_pool, function(config, key) {
                            if (keyDict[key]) {
                                if (!state[nodeName][key]) {
                                    state[nodeName][key] = {};
                                }
                                state[nodeName][key].threshold = config.queue_size;
                                state[nodeName][key].throttle = false;
                            }
                        })
                    });

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