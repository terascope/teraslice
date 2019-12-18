'use strict';

const express = require('express');
const request = require('request');
const { pDelay, logError, get } = require('@terascope/utils');
const { ClusterMaster } = require('@terascope/teraslice-messaging');
const { makeLogger } = require('../workers/helpers/terafoundation');
const makeExecutionService = require('./services/execution');
const makeApiService = require('./services/api');
const makeJobsService = require('./services/jobs');
const makeClusterService = require('./services/cluster');
const makeJobStore = require('./storage/jobs');
const makeExStore = require('./storage/execution');
const makeStateStore = require('./storage/state');

module.exports = function _clusterMaster(context) {
    const logger = makeLogger(context, 'cluster_master');
    const clusterConfig = context.sysconfig.teraslice;
    const assetsPort = process.env.assets_port;
    const assetsUrl = `http://127.0.0.1:${assetsPort}`;
    let running = false;

    // Initialize the HTTP service for handling incoming requests.
    const app = express();

    const clusterMasterServer = new ClusterMaster.Server({
        port: clusterConfig.port,
        nodeDisconnectTimeout: clusterConfig.node_disconnect_timeout,
        // setting request timeout to 5 minutes
        serverTimeout: 300000,
        // we do this to override express final response handler
        requestListener(req, res) {
            app(req, res, (err) => {
                if (err) logger.warn(err, 'unexpected server error');
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'api is not available' }));
            });
        },
        networkLatencyBuffer: clusterConfig.network_latency_buffer,
        actionTimeout: clusterConfig.action_timeout,
        logger,
    });

    const serviceOptions = { assetsUrl, app, clusterMasterServer };
    const services = Object.freeze({
        execution: makeExecutionService(context, serviceOptions),
        jobs: makeJobsService(context),
        cluster: makeClusterService(context, serviceOptions),
        api: makeApiService(context, serviceOptions),
    });

    context.services = services;

    function isAssetServiceUp() {
        return new Promise((resolve) => {
            request.get(
                {
                    baseUrl: assetsUrl,
                    uri: '/status',
                    json: true,
                    timeout: 900,
                },
                (err, response) => {
                    resolve(get(response, 'body.available', false));
                }
            );
        });
    }

    function waitForAssetsService(timeoutAt) {
        if (Date.now() > timeoutAt) {
            return Promise.reject(new Error('Timeout waiting for asset service to come online'));
        }
        return isAssetServiceUp().then((isUp) => {
            if (isUp) return Promise.resolve();
            return pDelay(1000).then(() => waitForAssetsService(timeoutAt));
        });
    }

    return {
        async initialize() {
            try {
                await clusterMasterServer.start();
                logger.info(`cluster master listening on port ${clusterConfig.port}`);

                const [exStore, stateStore, jobStore] = await Promise.all([
                    makeExStore(context),
                    makeStateStore(context),
                    makeJobStore(context)
                ]);

                context.stores = {
                    execution: exStore,
                    state: stateStore,
                    jobs: jobStore,
                };

                // order matters
                await services.cluster.initialize();
                await services.execution.initialize();
                await services.jobs.initialize();
                await services.api.initialize();

                logger.debug('services has been initialized');

                // give the assets service a bit to come up
                const fiveMinutes = 5 * 60 * 1000;
                await waitForAssetsService(Date.now() + fiveMinutes);

                logger.info('cluster master is ready!');
                running = true;
            } catch (err) {
                logError(logger, err, 'error during service initialization');
                running = false;
                throw err;
            }
        },
        run() {
            return new Promise((resolve) => {
                if (!running) {
                    resolve();
                    return;
                }
                const runningInterval = setInterval(() => {
                    if (!running) {
                        clearInterval(runningInterval);
                        resolve();
                    }
                }, 1000);
            });
        },
        async shutdown() {
            running = false;

            logger.info('cluster_master is shutting down');
            clusterMasterServer.isShuttingDown = true;

            await Promise.all(Object.entries(context.services)
                .map(async ([name, service]) => {
                    try {
                        await service.shutdown();
                    } catch (err) {
                        logError(logger, err, `Failure to shutdown service ${name}`);
                    }
                }));

            await Promise.all(Object.entries(context.stores)
                .map(async ([name, store]) => {
                    try {
                        await store.shutdown();
                    } catch (err) {
                        logError(logger, err, `Failure to shutdown store ${name}`);
                    }
                }));

            await clusterMasterServer.shutdown();
        },
    };
};
