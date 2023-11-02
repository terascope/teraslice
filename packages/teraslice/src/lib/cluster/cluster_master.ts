import express from 'express';
import got from 'got';
import {
    pDelay, logError, get, parseError
} from '@terascope/utils';
import type { Context } from '@terascope/job-components';
import { ClusterMaster } from '@terascope/teraslice-messaging';
import { makeLogger } from '../workers/helpers/terafoundation';
import makeExecutionService from './services/execution';
import makeApiService from './services/api';
import makeJobsService from './services/jobs';
import makeClusterService from './services/cluster';
import makeJobStore from '../storage/jobs';
import makeExStore from '../storage/execution';
import makeStateStore from '../storage/state';

export default function _clusterMaster(context: Context) {
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
        serverTimeout: clusterConfig.api_response_timeout,
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

    async function isAssetServiceUp() {
        try {
            const response = await got.get('status', {
                prefixUrl: assetsUrl,
                responseType: 'json',
                throwHttpErrors: true,
                timeout: 900,
                retry: 0,
            });
            return get(response, 'body.available', false);
        } catch (err) {
            logger.debug(`asset service not up yet, error: ${parseError(err)}`);
            return false;
        }
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

    const serviceOptions = { assetsUrl, app, clusterMasterServer };
    const services = Object.freeze({
        execution: makeExecutionService(context, serviceOptions),
        jobs: makeJobsService(context, serviceOptions),
        cluster: makeClusterService(context, serviceOptions),
        api: makeApiService(context, serviceOptions),
    });

    context.services = services;

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

                logger.debug('services has been initialized');

                // give the assets service a bit to come up
                const fiveMinutes = 5 * 60 * 1000;
                await waitForAssetsService(Date.now() + fiveMinutes);

                // this needs to be last
                await services.api.initialize();

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
                    resolve(true);
                    return;
                }
                const runningInterval = setInterval(() => {
                    if (!running) {
                        clearInterval(runningInterval);
                        resolve(true);
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
