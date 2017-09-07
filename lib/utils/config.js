'use strict';

var Promise = require('bluebird');


function getOpConfig(job, name) {
    return job.operations.find(function(op) {
        return op._op === name;
    })
}

function getClient(context, config, type) {
    var clientConfig = {};
    var events = context.foundation.getEventEmitter();
    clientConfig.type = type;

    if (config && config.hasOwnProperty('connection')) {
        clientConfig.endpoint = config.connection ? config.connection : 'default';
        clientConfig.cached = config.connection_cache !== undefined ? config.connection_cache : true;

    }
    else {
        clientConfig.endpoint = 'default';
        clientConfig.cached = true;
    }
    try {
        return context.foundation.getConnection(clientConfig).client;
    }
    catch (err) {
        var errMsg = `No configuration for endpoint ${clientConfig.endpoint} was found in the terafoundation connectors config, error: ${err.stack}`;
        context.logger.error(errMsg);
        events.emit('getClient:config_error', {err: errMsg})
    }
}

function instantiateJob(context, events, logger) {
    return new Promise(function(resolve, reject) {
        var job_runner = require('../cluster/runners/job')(context);
        var gettingJob = true;
        var gettingJobInterval;
        var job;

        events.on('worker:assets_loaded', function(ipcMessage) {
            if (ipcMessage.error) {
                logger.error(`Error while loading assets, error: ${ipcMessage.error}`);
                events.removeAllListeners('worker:assets_loaded');
                reject(ipcMessage.error)
            }
            else {
                gettingJobInterval = setInterval(function() {
                    if (!gettingJob) {
                        gettingJob = true;
                        Promise.resolve(job_runner.initialize())
                            .then(function(job) {
                                clearInterval(gettingJobInterval);
                                events.removeAllListeners('worker:assets_loaded');
                                resolve(job)
                            })
                            .catch(function(err) {
                                clearInterval(gettingJobInterval);
                                events.removeAllListeners('worker:assets_loaded');
                                logger.error('error initializing job after loading assets', err.message);
                                reject(err.message)
                            })
                    }
                }, 100);

            }
        });

        Promise.resolve(job_runner.initialize())
            .then(function(job) {
                events.removeAllListeners('worker:assets_loaded');
                clearInterval(gettingJobInterval);
                resolve(job)
            })
            .catch(function(err) {
                //if this errors, then we will wait for the events to fire to start job
                if (process.env.needsAssets === 'null') {
                    //error out if there are no assets and job cannot initialize straight away
                    reject(parseError(err))
                }
                else {
                    gettingJob = false;
                }
            });
    })
}


module.exports = {
    getClient: getClient,
    getOpConfig: getOpConfig,
    instantiateJob: instantiateJob
};