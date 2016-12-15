'use strict';
var getClient = require('../../../utils/config').getClient;
var Promise = require('bluebird');
var _ = require('lodash');


module.exports = function(context, logger) {
    //list of queue's to pay attention to
    var keyDict = {index: true, search: true, get: true, bulk: true};
    var state = {};
    var clients = collectClient(context);
    var limit = context.sysconfig.teraslice.moderator_limit;
    var resume = context.sysconfig.teraslice.moderator_resume;


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
                    let client_name = client.__esConnection;

                    _.forOwn(results.nodes, function(stats, node_name) {
                        if (state[client_name][node_name]) {
                            _.forOwn(stats.thread_pool, function(val, key) {
                                if (state[client_name][node_name][key]) {
                                    let threshold = state[client_name][node_name][key].threshold;
                                    let queue = val.queue;

                                    //TODO make this a config option
                                    //if queue is over threshold and connection is not already throttled, add to paused list
                                    if (queue / threshold >= limit && !state[client_name].throttle) {
                                        state[client_name].throttle = true;
                                        throttleJobs.push({
                                            type: 'elasticsearch',
                                            connection: client_name
                                        })
                                    }

                                    //TODO make this a config option
                                    if (queue / threshold < resume && state[client_name].throttle) {
                                        state[client_name].throttle = false;
                                        resumeJobs.push({
                                            type: 'elasticsearch',
                                            connection: client_name
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
    //TODO veirfy if new nodes (id's) are made live, could effect how initialize happens
    function initialize() {
        return Promise.map(clients, function(client) {
            return client.nodes.info()
                .then(function(results) {
                    let client_name = client.__esConnection;
                    //top level connection name
                    state[client_name] = {throttle: false};
                    _.forOwn(results.nodes, function(stats, node_name) {
                        //add correct node info per connection
                        state[client_name][node_name] = {};
                        _.forOwn(stats.thread_pool, function(config, key) {
                            if (keyDict[key]) {
                                //specific thread_pool that we are interested in
                                state[client_name][node_name][key] = {};
                                state[client_name][node_name][key].threshold = config.queue_size;
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