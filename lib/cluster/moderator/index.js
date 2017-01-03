'use strict';

var messageModule = require('./../services/messaging');
var elasticError = require('../../utils/error_utils').elasticError;
var _ = require('lodash');

module.exports = function(context) {
    var logger = context.foundation.makeLogger('moderator', 'moderator', {module: 'moderator'});
    var interval = context.sysconfig.teraslice.moderator_interval;
    var messaging = messageModule(context, logger);
    var host = messaging.getHostUrl();

    messaging.register('network:connect', function() {
        //TODO verify this logic here on separate machine
        logger.info(`moderator has successfully connected to: ${host}`);
        //TODO need logic for moderator disconnect on both sides
        messaging.send('moderator:online', {moderator: 'moderator:elasticsearch'})
    });

    messaging.register('cluster_master:check_moderator', function(msg) {
        //TODO verify this logic here on separate machine

        logger.info(`i got the message checking the job queue`, msg);
        var canRun = _.every(msg.data, function(conn) {
            return moderator.checkState(conn).throttle === false;
        });
        
        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster_master:check_moderator',
            canRun: canRun
        });
    });

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);
    messaging.register('worker:shutdown', moderatorShutdown);

    messaging.initialize();

    var moderator = getModerator(context, logger);
    var moderatorEngine;

    //query db, set up any stateful instances to track ie ES => queue sizes
    moderator.initialize()
        .then(function() {
            moderatorEngine = setInterval(checkService, interval);
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            logger.error(errMsg);
            //TODO what to do from here?
        });

    function checkService() {
        //health checks are called here
        //TODO might need a verification from cluster_master that the pause/resume job actually worked
        moderator.check_service()
            .then(function(results) {
                //results is an obj with keys that either are set to null, or an array of connections
                if (results.pause) {
                    messaging.send('moderator:pause_jobs', results.pause)
                }

                if (results.resume) {
                    messaging.send('moderator:resume_jobs', results.resume)
                }
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error('Moderator error while checking services', errMsg);
                //TODO what to do from here
            })
    }


    function moderatorShutdown() {
        logger.warn('moderator is shutting down');
        process.exit();
    }

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    function getModerator(context, logger) {
        return require('./modules/elasticsearch')(context, logger)
    }

};