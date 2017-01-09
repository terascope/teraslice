'use strict';

var messageModule = require('./../services/messaging');
var elasticError = require('../../utils/error_utils').elasticError;
var _ = require('lodash');

module.exports = function(context) {
    var logger = context.foundation.makeLogger('moderator', 'moderator', {module: 'moderator'});
    var interval = context.sysconfig.teraslice.moderator_interval;
    var messaging = messageModule(context, logger);
    var host = messaging.getHostUrl();

    var moderator = getModerator(context, logger);
    var moderatorEngine;

    var checkService = queryService();

    messaging.register('network:connect', function() {
        //TODO verify this logic here on separate machine
        logger.info(`moderator has successfully connected to: ${host}`);
        messaging.send('moderator:online', {moderator: 'moderator:elasticsearch'});
    });

    messaging.register('cluster:moderator:connection_ok', function(msg) {
        logger.info(`i got the message checking the job queue`, msg);
        var canRun = moderator.checkConnectionStates(msg.data);

        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster_master:check_moderator',
            connections: msg.data,
            canRun: canRun
        });
    });

    messaging.register('network:disconnect', function() {
        logger.warn(`moderator has disconnected to: ${host}`);
        //TODO verify what else to be here
    });

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);
    messaging.register('worker:shutdown', moderatorShutdown);

    messaging.initialize();


    //query db, set up any stateful instances to track ie ES => queue sizes
    moderator.initialize()
        .then(function() {
            logger.info('moderator has initialize');
            moderatorEngine = setInterval(checkService, interval);
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            //TODO changed fixed message to whatever module its actually using
            logger.error(`Error initializing moderator for elasticsearch`, errMsg);
            process.exit()
        });

    function queryService() {
        var isChecking = false;
        //health checks are called here
        //TODO might need a verification from cluster_master that the pause/resume job actually worked
        return function() {
            if (!isChecking) {
                isChecking = true;
                moderator.check_service()
                    .then(function(results) {
                        logger.debug('results from moderator check_service', results);
                        //results is an obj with keys that either are set to null, or an array of connections
                        if (results.pause) {
                            messaging.send('moderator:pause_jobs', results.pause)
                        }

                        if (results.resume) {
                            messaging.send('moderator:resume_jobs', results.resume)
                        }
                        isChecking = false;
                    })
                    .catch(function(err) {
                        //error do to new nodes, so not true error, re-initialize
                        if (err.initialize) {
                            initialize
                        }
                        var errMsg = elasticError(err);
                        logger.error('Moderator error while checking services', errMsg);
                        isChecking = false;
                    })
            }
        }
    }


    function moderatorShutdown() {
        logger.warn('moderator is shutting down');
        process.exit();
    }

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    function getModerator(context, logger) {
        //TODO make this dynamic
        return require('./modules/elasticsearch')(context, logger)
    }

};