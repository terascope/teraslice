import express from 'express';
import got from 'got';
import {
    pDelay, logError, get,
    parseError, Logger
} from '@terascope/utils';
import { ClusterMaster as ClusterMasterMessaging } from '@terascope/teraslice-messaging';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import {
    ExecutionService, ApiService, JobsService, makeClustering
} from './services/index.js';
import { JobsStorage, ExecutionStorage, StateStorage } from '../storage/index.js';
import { ClusterMasterContext } from '../../interfaces.js';
import { getPackageJSON } from '../utils/file_utils.js';

export class ClusterMaster {
    context: ClusterMasterContext;
    logger: Logger;
    running = false;
    readonly assetsUrl: string;
    private messagingServer!: ClusterMasterMessaging.Server;

    constructor(context: ClusterMasterContext) {
        this.context = context;
        this.logger = makeLogger(context, 'cluster_master');
        const assetsPort = process.env.assets_port;
        this.assetsUrl = `http://127.0.0.1:${assetsPort}`;
    }

    async isAssetServiceUp() {
        try {
            const response = await got.get('status', {
                prefixUrl: this.assetsUrl,
                responseType: 'json',
                throwHttpErrors: true,
                timeout: 900,
                retry: 0,
            });
            return get(response, 'body.available', false);
        } catch (err) {
            this.logger.debug(`asset service not up yet, error: ${parseError(err)}`);
            return false;
        }
    }

    async waitForAssetsService(timeoutAt: number): Promise<boolean> {
        if (Date.now() > timeoutAt) {
            return Promise.reject(new Error('Timeout waiting for asset service to come online'));
        }
        const isUp = await this.isAssetServiceUp();

        if (isUp) {
            return true;
        }

        await pDelay(1000);

        return this.waitForAssetsService(timeoutAt);
    }

    async initialize() {
        const clusterConfig = this.context.sysconfig.teraslice;
        const foundation = this.context.sysconfig.terafoundation;
        const { logger } = this;

        try {
            // Initialize the HTTP service for handling incoming requests.
            const app = express();

            this.messagingServer = new ClusterMasterMessaging.Server({
                port: clusterConfig.port,
                nodeDisconnectTimeout: clusterConfig.node_disconnect_timeout,
                // setting request timeout to 5 minutes
                serverTimeout: clusterConfig.api_response_timeout,
                // we do this to override express final response handler
                requestListener(req, res) {
                    // @ts-expect-error
                    app(req, res, (err) => {
                        if (err) {
                            logger.warn(err, 'unexpected server error');
                        }
                        res.setHeader('Content-Type', 'application/json');
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: 'api is not available' }));
                    });
                },
                networkLatencyBuffer: clusterConfig.network_latency_buffer,
                actionTimeout: clusterConfig.action_timeout,
                logger: this.logger,
            });

            const serviceOptions = {
                assetsUrl: this.assetsUrl,
                app,
                clusterMasterServer: this.messagingServer
            };

            const executionService = new ExecutionService(this.context, serviceOptions);
            const jobsService = new JobsService(this.context);
            const clusterService = makeClustering(this.context, serviceOptions);
            const apiService = new ApiService(this.context, serviceOptions);

            const services = Object.freeze({
                executionService,
                jobsService,
                clusterService,
                apiService,
            });

            this.context.services = services;
            await this.messagingServer.start();
            this.logger.info(`cluster master listening on port ${clusterConfig.port}`);

            const executionStorage = new ExecutionStorage(this.context);
            const stateStorage = new StateStorage(this.context);
            const jobsStorage = new JobsStorage(this.context);

            await Promise.all([
                executionStorage.initialize(),
                stateStorage.initialize(),
                jobsStorage.initialize()
            ]);

            this.context.stores = {
                executionStorage,
                stateStorage,
                jobsStorage,
            };

            // order matters
            await services.clusterService.initialize();
            await services.executionService.initialize();
            await services.jobsService.initialize();

            this.logger.debug('services has been initialized');

            // give the assets service a bit to come up
            const fiveMinutes = 5 * 60 * 1000;
            await this.waitForAssetsService(Date.now() + fiveMinutes);

            // this needs to be last
            await services.apiService.initialize();

            await this.context.apis.foundation.promMetrics.init({
                context: this.context,
                logger: this.logger,
                assignment: 'cluster_master',
                port: foundation.prom_metrics_port,
            });

            await this.context.apis.foundation.promMetrics.addMetric(
                'info',
                'Information about Teraslice cluster master',
                ['arch', 'clustering_type', 'name', 'node_version', 'platform', 'teraslice_version'],
                'gauge'
            );
            this.context.apis.foundation.promMetrics.set(
                'info',
                {
                    arch: this.context.arch,
                    clustering_type: this.context.sysconfig.teraslice.cluster_manager_type,
                    name: this.context.sysconfig.teraslice.name,
                    node_version: process.version,
                    platform: this.context.platform,
                    teraslice_version: getPackageJSON().version
                },
                1
            );

            this.logger.info('cluster master is ready!');
            this.running = true;
        } catch (err) {
            logError(this.logger, err, 'error during service initialization');
            this.running = false;
            throw err;
        }
    }

    async run() {
        return new Promise((resolve) => {
            if (!this.running) {
                resolve(true);
                return;
            }
            const runningInterval = setInterval(() => {
                if (!this.running) {
                    clearInterval(runningInterval);
                    resolve(true);
                }
            }, 1000);
        });
    }

    async shutdown() {
        this.running = false;

        this.logger.info('cluster_master is shutting down');
        this.messagingServer.isShuttingDown = true;

        await Promise.all(Object.entries(this.context.services)
            .map(async ([name, service]) => {
                try {
                    await service.shutdown();
                } catch (err) {
                    logError(this.logger, err, `Failure to shutdown service ${name}`);
                }
            }));

        await Promise.all(Object.entries(this.context.stores)
            .map(async ([name, store]) => {
                try {
                    await store.shutdown();
                } catch (err) {
                    logError(this.logger, err, `Failure to shutdown store ${name}`);
                }
            }));

        await this.messagingServer.shutdown();
    }
}
