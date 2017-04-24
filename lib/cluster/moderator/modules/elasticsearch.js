'use strict';
var getClient = require('../../../utils/config').getClient;
var Promise = require('bluebird');
var parseError = require('../../../utils/error_utils').parseError;
var _ = require('lodash');

module.exports = function(context, logger) {
    var limit = context.sysconfig.teraslice.moderator_limit;
    var resume = context.sysconfig.teraslice.moderator_resume;
    //list of queue's to pay attention to
    var keyDict = {index: true, search: true, get: true, bulk: true};

    //list of clients which will be used in checkModerator, it is set in initialize
    var clients = [];

    var state = {};

    //used to set state and queue size limits
    function initializeConnection(client) {
        let client_name = client.__esConnection;

        if (!state[client_name]) {
            //we want to stop jobs until its been check_service clears first time
            state[client_name] = {throttle: true, beenCheckedAfterInit: false};
        }
        return client.__esModule.nodeInfo()
            .then(function(results) {
                //top level connection name
                _.forOwn(results.nodes, function(stats, node_name) {
                    //add correct node info per connection
                    if (!state[client_name][node_name]) {
                        state[client_name][node_name] = {};
                    }
                    _.forOwn(stats.thread_pool, function(config, key) {
                        if (keyDict[key]) {
                            //specific thread_pool that we are interested in
                            if (!state[client_name][node_name][key]) {
                                state[client_name][node_name][key] = {};
                            }
                            state[client_name][node_name][key].threshold = config.queue_size;
                        }
                    })
                });
                logger.debug(`connection: ${client.__esConnection} has initialized, state`, state)
            })
    }

    // initialize attempts to set up each connection and resolves when all are tried at least once
    // if connection is set up, its added to the client array which is used to monitor stats
    // connections that aren't successful retry individually with exponential back-off until succeeds

    function initialize(client) {
        let retryTimer = {start: 5000, limit: 10000};

        if (!client) {
            //need to initialize everything
            let clientCounter = 0;
            let totalClients = Object.keys(context.sysconfig.terafoundation.connectors.elasticsearch).length;

            return new Promise(function(resolve, reject) {
                _.forOwn(context.sysconfig.terafoundation.connectors.elasticsearch, function(val, key) {
                    let client = getClient(context, {connection: key}, 'elasticsearch');
                    client.__esConnection = key;
                    client.__esModule = require('../../../data_sources/elasticsearch')(client, logger, null);

                    initializeConnection(client)
                        .then(function() {
                            clientCounter += 1;
                            clients.push(client);
                        })
                        .catch(function(err) {
                            var errMsg = parseError(err);
                            logger.error(`error initializing client ${client.__esConnection}`, errMsg);
                            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                            if (retryTimer.limit < 60000) {
                                retryTimer.limit += 10000
                            }
                            if (retryTimer.start < 30000) {
                                retryTimer.start += 5000
                            }
                            setTimeout(function() {
                                initialize(client);
                            }, timer);

                            //attempt made 
                            clientCounter += 1;
                        });
                });

                //check to see if all clients connections have been processed at least once
                var initInterval = setInterval(function() {
                    if (clientCounter === totalClients) {
                        clearInterval(initInterval);
                        resolve(Promise.resolve(true))
                    }
                }, 250)

            });
        }
        else {
            //need to initialize specific client
            return initializeConnection(client)
                .then(function() {
                    clients.push(client);
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    logger.error(`error initializing client ${client.__esConnection}`, errMsg);

                    let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                    if (retryTimer.limit < 60000) {
                        retryTimer.limit += 10000
                    }
                    if (retryTimer.start < 30000) {
                        retryTimer.start += 5000
                    }
                    setTimeout(function() {
                        initialize(client);
                    }, timer);
                });
        }
    }

    //compares node stats to limits, returns list of connections that need to be throttled or resumed
    function check_service() {
        let throttleJobs = [];
        let resumeJobs = [];
        let newNode = false;

        return Promise.map(clients, function(client) {
            return client.__esModule.nodeStats()
                .then(function(results) {
                    let client_name = client.__esConnection;
                    let isHealthy = _.every(results.nodes, function(stats, node_name) {
                        //check if node exists on state obj
                        if (_.get(state, `[${client_name}][${node_name}]`)) {
                            //make sure all monitored thread pool are ok
                            return _.every(stats.thread_pool, function(val, key) {
                                //only check specific threads that we are interested in
                                if (_.get(state, `[${client_name}][${node_name}][${key}]`)) {
                                    let threshold = state[client_name][node_name][key].threshold;
                                    let queue = val.queue;
                                    let queueDepth = queue / threshold;
                                    logger.trace(`connection: ${client_name} , node: ${node_name} , thread_pool: ${key} , queue: ${queue}, threshold: ${threshold}, queueDepth: ${queueDepth}`);

                                    if (queueDepth < limit) {
                                        //if its already throttled, return false if its not under the resume threshold
                                        if (state[client_name].throttle && state[client_name].beenCheckedAfterInit && queueDepth > resume) {
                                            return false
                                        }

                                        return true;
                                    }

                                    return false;
                                }
                                //key is not being monitored, return true to not conflict
                                return true;
                            });
                        }
                        else {
                            //since it's not found in state, it must be a new node, return false to stop the iteration
                            newNode = true;
                            return false;
                        }
                    });

                    //a new node has appeared, need to reinitialize and then checkService again
                    if (newNode) {
                        logger.warn(`new nodes have been found in the cluster, re-initializing`);
                        return Promise.reject({initialize: true})
                    }

                    if (isHealthy && state[client_name].throttle) {
                        //node is now healthy 
                        state[client_name].throttle = false;
                        resumeJobs.push({
                            type: 'elasticsearch',
                            connection: client_name
                        });
                        //after its been cleared, set flag to true
                        if (state[client_name].beenCheckedAfterInit === false) {
                            state[client_name].beenCheckedAfterInit = true
                        }
                    }

                    //only throttle  if it isnt healthy and has not already been throttled
                    if (isHealthy === false && state[client_name].throttle === false) {
                        state[client_name].throttle = true;
                        throttleJobs.push({
                            type: 'elasticsearch',
                            connection: client_name
                        });
                        
                        if (state[client_name].beenCheckedAfterInit === false) {
                            state[client_name].beenCheckedAfterInit = true
                        }
                    }

                    //check was successfully completed
                    return true;
                })
                .catch(function(err) {
                    //new node came online, need to re-initialize
                    if (err.initialize) {
                        return Promise.reject(err)
                    }
                    else {
                        //real error, pass it along
                        var errMsg = parseError(err);
                        logger.error(`error with client ${client.__esConnection}`, errMsg);
                        return Promise.reject(errMsg);
                    }
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
                if (err.initialize) {
                    //new node came online, need to re-initialize
                    return Promise.reject(err)
                }
                else {
                    //real error, pass it along
                    var errMsg = parseError(err);
                    logger.error('check service error', errMsg);
                    return Promise.reject(err)
                }
            })
    }

    // Primarily used to see if connection is throttled
    function checkConnectionStates(conns) {
        //state connection defaults are added in job service at job check
        return _.every(conns, function(conn) {
            return state[conn].throttle === false;
        });
    }

    return {
        initialize: initialize,
        check_service: check_service,
        checkConnectionStates: checkConnectionStates
    }
};