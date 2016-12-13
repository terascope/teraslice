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
        let resumeJobs = [];

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
                                 //   logger.warn('what am i checking', key, queue, threshold, queue / threshold > 0.85);
                                    if (queue / threshold >= 0.5) {
                                        logger.error('i shold be in here')
                                        state[nodeName][key].throttle = true;
                                        throttleJobs.push({
                                            type: 'elasticsearch',
                                            connection: client.__esConnection,
                                            nodeName: nodeName,
                                            thread_pool: key,
                                            rate: `${queue}/${threshold}`
                                        })
                                    }
                                    
                                    //TODO make this a config option
                                    if (queue / threshold < 0.5 && state[nodeName][key].throttle) {
                                       /* state[nodeName][key].throttle = false;
                                        resumeJobs.push({
                                            type: 'elasticsearch',
                                            connection: client.__esConnection,
                                            nodeName: nodeName,
                                            thread_pool: key,
                                            rate: `${queue}/${threshold}`
                                        })*/
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
                //TODO verify if the possiblility of both jobs exists in pause and resume and prevent that if needed
                let results = {pause: false, resume: false};

                if (throttleJobs.length > 0) {
                    logger.error('should be returning results of throttle', throttleJobs)

                    results.pause = throttleJobs;
                }
                if (resumeJobs.length > 0) {
                    results.resume = resumeJobs;
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
                                console.log('whats the val', config);
                                state[nodeName][key].threshold = config.queue_size;
                                state[nodeName][key].throttle = false;
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