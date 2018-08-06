'use strict';

const parseError = require('@terascope/error-parser');
const messageModule = require('./../services/messaging');

module.exports = function (context) {
    const logger = context.foundation.makeLogger({ module: 'moderator' });
    const interval = context.sysconfig.teraslice.moderator_interval;
    const messaging = messageModule(context, logger);
    const host = messaging.getHostUrl();

    const moderator = getModerator(context, logger);
    let moderatorEngine;

    const checkService = queryService();

    messaging.register('network:connect', () => {
        logger.info(`moderator has successfully connected to: ${host}`);
        messaging.send('moderator:online', { moderator: 'moderator:elasticsearch' });
    });

    messaging.register('cluster:moderator:connection_ok', (msg) => {
        logger.debug('checking cluster for the job queue', msg);
        const canRun = moderator.checkConnectionStates(msg.data);

        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster_master:check_moderator',
            connections: msg.data,
            canRun
        });
    });

    messaging.register('network:disconnect', () => {
        logger.warn(`moderator has disconnected to: ${host}`);
        // TODO verify what else to be here
    });

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);
    messaging.register('worker:shutdown', moderatorShutdown);

    // query db, set up any stateful instances to track ie ES => queue sizes
    moderator.initialize()
        .then(() => {
            // this logger message is used in testing, check logger.info fn of moderator_elasticsearch-spec.js file
            logger.info('moderator has initialized');
            messaging.initialize();
            // checking things in case jobs ask for clearance before moderatorEngine runs
            return checkService();
        })
        .then(() => {
            moderatorEngine = setInterval(checkService, interval);
        })
        .catch((err) => {
            const errMsg = parseError(err);
            // TODO changed fixed message to whatever module its actually using
            logger.error('Error initializing moderator for elasticsearch', errMsg);
            process.exit();
        });

    function queryService() {
        let isChecking = false;
        // health checks are called here
        // TODO might need a verification from cluster_master that the pause/resume job actually worked
        return function () {
            if (!isChecking) {
                isChecking = true;
                return moderator.check_service()
                    .then((results) => {
                        logger.debug('results from moderator check_service', results);
                        // results is an obj with keys that either are set to null, or an array of connections
                        if (results.pause) {
                            messaging.send('moderator:pause_jobs', results.pause);
                        }

                        if (results.resume) {
                            messaging.send('moderator:resume_jobs', results.resume);
                        }
                        isChecking = false;
                    })
                    .catch((err) => {
                        // error do to new nodes, so not true error, re-initialize
                        if (err.initialize) {
                            logger.warn('re-initializing services');
                            moderator.initialize()
                                .then(() => {
                                    logger.warn('re-initializing complete, resuming');
                                    isChecking = false;
                                });
                        } else {
                            const errMsg = parseError(err);
                            logger.error('Moderator error while checking services', errMsg);
                            isChecking = false;
                        }
                    });
            }
        };
    }


    function moderatorShutdown() {
        logger.warn('moderator is shutting down');
        process.exit();
    }

    // to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    function getModerator(context, logger) {
        // TODO make this dynamic
        return require('./modules/elasticsearch')(context, logger);
    }
};
