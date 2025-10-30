import express from 'express';
import got from 'got';
import {
    pDelay, logError, get,
    parseError, Logger
} from '@terascope/core-utils';
import { ClusterMaster as ClusterMasterMessaging } from '@terascope/teraslice-messaging';
import { isPromAvailable } from '@terascope/job-components';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import {
    ExecutionService, ApiService, JobsService, makeClustering
} from './services/index.js';
import { JobsStorage, ExecutionStorage, StateStorage } from '../storage/index.js';
import { ClusterMasterContext } from '../../interfaces.js';

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
                timeout: {
                    request: 900
                },
                retry: {
                    limit: 0
                }
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

            /// initialize promClient
            if (this.context.sysconfig.teraslice.cluster_manager_type === 'native') {
                this.logger.warn('Skipping PromMetricsAPI initialization: incompatible with native clustering.');
            } else {
                const { terafoundation } = this.context.sysconfig;
                await this.context.apis.foundation.promMetrics.init({
                    terasliceName: this.context.sysconfig.teraslice.name,
                    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                    tf_prom_metrics_port: terafoundation.prom_metrics_port,
                    logger: this.logger,
                    assignment: 'master',
                    prefix: 'teraslice_',
                    prom_metrics_display_url: terafoundation.prom_metrics_display_url
                });

                await this.setupPromMetrics();
            }

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

        if (isPromAvailable(this.context)) {
            await this.context.apis.foundation.promMetrics.shutdown();
        }
    }

    /**
     * Adds all prom metrics specific to the cluster_master.
     *
     * If trying to add a new metric for the cluster_master, it belongs here.
     * @async
     * @function setupPromMetrics
     * @return {Promise<void>}
     * @link https://terascope.github.io/teraslice/docs/development/k8s#prometheus-metrics-api
     */
    async setupPromMetrics() {
        if (isPromAvailable(this.context)) {
            this.logger.info(`adding ${this.context.assignment} prom metrics...`);
            /*
                TODO: After reviewing these metrics, I've conluded that all of these
                can be handled by th execution controller. We might move these into the execution
                controller metrics down the line. The master can maybe keep track of how many ex
                controllers there are? Some sort of overview of everything and leave the specifics
                to each ex.

            */
            await Promise.all([
                this.context.apis.foundation.promMetrics.addGauge(
                    'master_info',
                    'Information about Teraslice cluster master',
                    ['arch', 'clustering_type', 'name', 'node_version', 'platform', 'teraslice_version']
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'slices_processed',
                    'Total slices processed across the cluster',
                    []
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'slices_failed',
                    'Total slices failed across the cluster',
                    []
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'slices_queued',
                    'Total slices queued across the cluster',
                    []
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'workers_joined',
                    'Total workers joined across the cluster',
                    []
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'workers_disconnected',
                    'Total workers disconnected across the cluster',
                    []
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'workers_reconnected',
                    'Total workers reconnected across the cluster',
                    []
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_workers_active',
                    'Number of Teraslice workers actively processing slices.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_workers_available',
                    'Number of Teraslice workers running and waiting for work.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_workers_joined',
                    'Total number of Teraslice workers that have joined the execution controller for this job.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_workers_reconnected',
                    'Total number of Teraslice workers that have reconnected to the execution controller for this job.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_workers_disconnected',
                    'Total number of Teraslice workers that have disconnected from execution controller for this job.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_info',
                    'Information about Teraslice execution.',
                    ['ex_id', 'job_id', 'image', 'version'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_slicers_count',
                    'Number of execution controllers (slicers) running for this execution.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                // Execution Related Metrics
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_cpu_limit',
                    'CPU core limit for a Teraslice worker container.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_cpu_request',
                    'Requested number of CPU cores for a Teraslice worker container.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_memory_limit',
                    'Memory limit for Teraslice a worker container.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_memory_request',
                    'Requested amount of memory for a Teraslice worker container.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_status',
                    'Current status of the Teraslice execution.',
                    ['ex_id', 'job_id', 'job_name', 'status'],
                ),
                /*
                    TODO: The following gauges should be Counters. This was not done because
                    teraslice master already provided the count total for most of these metrics.
                    So setting the gauge is the only real way to gather the metrics in master.
                    Solution to convert would be setting the count in the ex process.
                */
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_slices_processed',
                    'Number of slices processed.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_slices_failed',
                    'Number of slices failed.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'controller_slices_queued',
                    'Number of slices queued for processing.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_created_timestamp_seconds',
                    'Execution creation time.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_updated_timestamp_seconds',
                    'Execution update time.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_slicers',
                    'Number of slicers defined on the execution.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_workers',
                    'Number of workers defined on the execution.  Note that the number of actual workers can differ from this value.',
                    ['ex_id', 'job_id', 'job_name'],
                ),
            ]);
        }
    }
}
