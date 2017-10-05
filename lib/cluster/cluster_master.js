'use strict';

const Promise = require('bluebird');
const makeLogs = require('./storage/logs');
const messageModule = require('./services/messaging');
const _ = require('lodash');

module.exports = function (context) {
    const logger = context.foundation.makeLogger({ module: 'cluster_master' });
    const clusterConfig = context.sysconfig.teraslice;
    const parseError = require('../utils/error_utils').parseError;

    // Initialize the HTTP service for handling incoming requests.
    const app = require('express')();
    const server = app.listen(clusterConfig.port);
    logger.info(`listening on port ${clusterConfig.port}`);

    const messaging = messageModule(context, logger);
    context.messaging = messaging;
    context.services = {};

    const assetServiceOnline = assetServicelistener();

    // ignore process calls, this is handled by ipc messages from node master
    messaging.register('process:SIGTERM', () => {});
    messaging.register('process:SIGINT', () => {});

    messaging.register('worker:shutdown', () => {
        // Would there be sequencing required here?
        logger.debug('cluster_master is shutting down');
        const shuttingdown = _.map(context.services, service => service.shutdown());

        Promise
            .all(shuttingdown)
            .then(() => {
                logger.trace('flushing the logger before exit');
                return logger.flush();
            })
            .then(() => {
                process.exit();
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while cluster_master shutting down, error: ${errMsg}`);
                setTimeout(() => {
                    process.exit(0);
                }, 10);
            });
    });

    function assetServicelistener() {
        let assetsServiceIsReady = false;
        let assetsServiceError = false;

        messaging.register('assets:service:available', (assetServiceResponse) => {
            if (assetServiceResponse.error) {
                assetsServiceError = true;
            } else {
                assetsServiceIsReady = true;
            }
        });
        return () => new Promise(((resolve, reject) => {
            if (assetsServiceIsReady) {
                resolve(true);
            } else {
                const assetReady = setInterval(() => {
                    if (assetsServiceIsReady) {
                        clearInterval(assetReady);
                        resolve(true);
                    }
                    if (assetsServiceError) {
                        clearInterval(assetReady);
                        reject('An error occurred while instantiating the assets service');
                    }
                }, 100);
            }
        }));
    }
    require('./services/execution.js')(context)
        .then((clusterService) => {
            messaging.initialize({ server });
            logger.trace('cluster_service has instantiated');
            context.services.execution = clusterService;
            return require('./services/jobs')(context);
        })
        .then((jobsService) => {
            logger.trace('jobs_service has instantiated');
            context.services.jobs = jobsService;
            return assetServiceOnline();
        })
        .then(() => require('./services/api')(context, app))
        .then((apiService) => {
            logger.trace('api_service has instantiated');
            context.services.api = apiService;
            return makeLogs(context);
        })
        .catch((err) => {
            const errMsg = parseError(err);
            logger.error('error during service initialization', errMsg);
            messaging.send({ message: 'cluster:error:terminal' });
        });
};
