'use strict';

var messageModule = require('./../services/messaging');
var elasticError = require('../../utils/error_utils').elasticError;


module.exports = function(context) {
    var logger = context.foundation.makeLogger('moderator', 'moderator', {module: 'moderator'});

    var messaging = messageModule(context, logger);
    var host = messaging.getHostUrl();

    messaging.register('moderator:cluster:connect', function() {
        logger.info(`moderator has successfully connected to: ${host}`);
        // messaging.send('moderator:online', {hello:'there'})
    });

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);
    messaging.register('worker:shutdown', moderatorShutdown);

    messaging.initialize();

    var moderator = getModerator(context, logger);
    var moderatorEngine;

    moderator.initialize()
        .then(function() {
            console.log('im all ready to go');
            moderatorEngine = setInterval(checkService, 3000);
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            logger.error(errMsg);
            //TODO what to do from here?
        });

    function checkService() {
        moderator.check_service()
            .then(function(throttleJobs) {
                if (throttleJobs) {
                    messaging.send('moderator:pause_jobs',{connections: throttleJobs})
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