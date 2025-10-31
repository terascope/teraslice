import { Router, Express } from 'express';
import bodyParser from 'body-parser';
import { pipeline as streamPipeline } from 'node:stream/promises';
import got, { OptionsInit } from 'got';
import { RecoveryCleanupType, TerasliceConfig } from '@terascope/job-components';
import {
    parseErrorInfo, parseList, logError,
    TSError, startsWith, Logger, pWhile,
    isKey
} from '@terascope/core-utils';
import { ExecutionStatusEnum } from '@terascope/types';
import { ClusterMasterContext, TerasliceRequest, TerasliceResponse } from '../../../interfaces.js';
import { makeLogger } from '../../workers/helpers/terafoundation.js';
import { ExecutionService, JobsService, ClusterServiceType } from '../services/index.js';
import type { JobsStorage, ExecutionStorage, StateStorage } from '../../storage/index.js';
import {
    makeTable, sendError, handleTerasliceRequest,
    getSearchOptions, createJobActiveQuery, addDeletedToQuery
} from '../../utils/api_utils.js';
import { getPackageJSON } from '../../utils/file_utils.js';

const terasliceVersion = getPackageJSON().version;

function validateCleanupType(cleanupType: RecoveryCleanupType) {
    if (cleanupType && !RecoveryCleanupType[cleanupType]) {
        const types = Object.values(RecoveryCleanupType);
        throw new TSError(`cleanup_type must be empty or set to ${types.join(', ')}`, {
            statusCode: 400
        });
    }
}

function validateGetDeletedOption(deletedOption: string) {
    if (!['true', 'false', ''].includes(deletedOption)) {
        throw new TSError('deleted query option must true or false', {
            statusCode: 400
        });
    }
}

export class ApiService {
    context: ClusterMasterContext;
    logger: Logger;
    jobsStorage!: JobsStorage;
    executionStorage!: ExecutionStorage;
    stateStorage!: StateStorage;
    executionService!: ExecutionService;
    jobsService!: JobsService;
    clusterService!: ClusterServiceType;
    available = false;
    clusterType: string;
    assetsUrl: string;
    terasliceConfig: TerasliceConfig;
    app: Express;

    constructor(
        context: ClusterMasterContext,
        { assetsUrl, app }: { assetsUrl: string; app: Express }
    ) {
        this.context = context;
        this.logger = makeLogger(context, 'api_service');
        this.assetsUrl = assetsUrl;
        this.terasliceConfig = context.sysconfig.teraslice;
        this.clusterType = this.terasliceConfig.cluster_manager_type;
        this.app = app;
    }

    private async _changeWorkers(exId: string, query: any) {
        let msg;
        let workerNum: number | undefined;
        const keyOptions = { add: true, remove: true, total: true };
        const queryKeys = Object.keys(query);

        if (!query) {
            throw new TSError('Must provide a query parameter in request', {
                statusCode: 400
            });
        }

        queryKeys.forEach((key) => {
            if (key in keyOptions) {
                msg = key;
                workerNum = Number(query[key]);
            }
        });

        if (!msg || Number.isNaN(workerNum) || (workerNum && workerNum <= 0)) {
            throw new TSError('Must provide a valid worker parameter(add/remove/total) that is a number and greater than zero', {
                statusCode: 400
            });
        }
        const numOfWorkers = workerNum as number;

        if (msg === 'add') {
            return this.executionService.addWorkers(exId, numOfWorkers);
        }

        if (msg === 'remove') {
            return this.executionService.removeWorkers(exId, numOfWorkers);
        }

        return this.executionService.setWorkers(exId, numOfWorkers);
    }

    private async _getExIdFromRequest(req: TerasliceRequest, allowWildcard = false) {
        const { path } = req;

        if (startsWith(path, '/ex')) {
            const { exId } = req.params;
            if (exId) return exId;

            if (allowWildcard) {
                return '*';
            }
            const error = new TSError('Execution Context ID is required');
            error.statusCode = 406;
            throw error;
        }

        if (startsWith(path, '/jobs')) {
            const { jobId } = req.params;
            const exId = await this.jobsService.getLatestExecutionId(jobId);

            if (!exId) {
                const error = new TSError(`No executions were found for job: ${jobId}`);
                error.statusCode = 404;
                throw error;
            }

            return exId;
        }

        const error = new TSError('Only /ex and /jobs are allowed');
        error.statusCode = 405;
        throw error;
    }

    private async _assetRedirect(req: TerasliceRequest, res: TerasliceResponse) {
        const options: OptionsInit & { isStream: true } = {
            prefixUrl: this.assetsUrl,
            headers: req.headers,
            searchParams: req.query as Record<string, any>,
            throwHttpErrors: false,
            timeout: { request: this.terasliceConfig.api_response_timeout },
            decompress: false,
            retry: { limit: 0 },
            isStream: true
        };

        const uri = req.url.replace(/^\//, '');
        const method = req.method.toLowerCase();

        try {
            if (!isKey(got.stream, method)) {
                throw new Error(`${method} is not a valid gotStream method`);
            }
            const stream = got.stream[method](uri, options);

            await streamPipeline(
                req,
                stream,
                res,
            );
        } catch (err) {
            const { statusCode, message } = parseErrorInfo(err, {
                defaultErrorMsg: 'Asset Service error while processing request'
            });
            sendError(res, statusCode, message, req.logger);
        }
    }

    private async _controllerStats(exId?: string) {
        return this.executionService.getControllerStats(exId);
    }

    async shutdown() {
        this.logger.info('shutting down api service');
    }

    async initialize() {
        this.logger.info('api service is initializing...');

        const { executionStorage, stateStorage, jobsStorage } = this.context.stores;

        if (stateStorage == null || executionStorage == null || jobsStorage == null) {
            throw new Error('Missing required stores');
        }

        const { executionService, jobsService, clusterService } = this.context.services;

        if (jobsService == null || executionService == null || clusterService == null) {
            throw new Error('Missing required services');
        }

        this.jobsService = jobsService;
        this.executionService = executionService;
        this.clusterService = clusterService;

        this.stateStorage = stateStorage;
        this.executionStorage = executionStorage;
        this.jobsStorage = jobsStorage;

        const v1routes = Router();
        const assetRedirect = this._assetRedirect.bind(this);

        this.app.use(bodyParser.json({
            type(req) {
                return (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded');
            }
        }));
        // @ts-expect-error
        this.app.use((err, req, res, next) => {
            if (err instanceof SyntaxError) {
                sendError(res, 400, 'the json submitted is malformed');
            } else {
                next();
            }
        });

        this.app.use((req, res, next) => {
            if (!this.available) {
                res.json({ error: 'api is not available' });
                return;
            }
            // @ts-expect-error
            req.logger = this.logger;
            next();
        });

        this.app.set('json spaces', 4);

        v1routes.get('/', (req, res) => {
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res);
            requestHandler(() => ({
                arch: this.context.arch,
                clustering_type: this.context.sysconfig.teraslice.cluster_manager_type,
                name: this.context.sysconfig.teraslice.name,
                node_version: process.version,
                platform: this.context.platform,
                teraslice_version: `v${terasliceVersion}`
            } as any));
        });

        v1routes.get('/cluster/state', (req, res) => {
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res);
            // @ts-expect-error
            requestHandler(() => this.clusterService.getClusterState());
        });

        v1routes.route('/assets{*splat}')
            .delete((req, res) => {
                assetRedirect(req as TerasliceRequest, res);
            })
            .post((req, res) => {
                if (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                    sendError(res, 400, '/asset endpoints do not accept json');
                    return;
                }
                assetRedirect(req as TerasliceRequest, res);
            })
            // @ts-expect-error
            .get(assetRedirect);

        v1routes.post('/jobs', (req, res) => {
            // if no job was posted an empty object is returned, so we check if it has values
            if (!req.body.operations) {
                sendError(res, 400, 'No job was posted');
                return;
            }

            const { start } = req.query;
            const jobSpec = req.body;
            const shouldRun = `${start}` !== 'false';

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Job submission failed');
            requestHandler(() => jobsService.submitJob(jobSpec, shouldRun));
        });

        v1routes.get('/jobs', (req, res) => {
            const { active = '', deleted = 'false', ex } = req.query;
            const { size, from, sort } = getSearchOptions(req as TerasliceRequest);

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not retrieve list of jobs');
            requestHandler(() => {
                validateGetDeletedOption(deleted as string);

                const partialQuery = createJobActiveQuery(active as string);
                const query = addDeletedToQuery(deleted as string, partialQuery);
                return typeof ex === 'string'
                    ? this.jobsService.getJobsWithExInfo(query, from, size, sort as string, ex.split(','))
                    : this.jobsStorage.search(query, from, size, sort as string);
            });
        });

        v1routes.get('/jobs/:jobId', (req, res) => {
            const { ex } = req.query;
            const { jobId } = req.params;
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not retrieve job');
            typeof ex === 'string'
                ? requestHandler(async () => this.jobsService.getJobWithExInfo(jobId, ex.split(',')))
                : requestHandler(async () => this.jobsStorage.get(jobId));
        });

        v1routes.put('/jobs/:jobId', (req, res) => {
            const { jobId } = req.params;
            const jobSpec = req.body;

            if (Object.keys(jobSpec).length === 0) {
                sendError(res, 400, `no data was provided to update job ${jobId}`);
                return;
            }
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not update job');
            requestHandler(async () => jobsService.updateJob(jobId, jobSpec));
        });

        v1routes.get('/jobs/:jobId/ex', (req, res) => {
            const { jobId } = req.params;
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not retrieve list of execution contexts');
            requestHandler(async () => jobsService.getLatestExecution(jobId));
        });

        v1routes.post('/jobs/:jobId/_active', (req, res) => {
            const { jobId } = req.params;
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, `Could not change active to 'true' for job: ${jobId}`);
            requestHandler(async () => jobsService.setActiveState(jobId, true));
        });

        v1routes.post('/jobs/:jobId/_inactive', (req, res) => {
            const { jobId } = req.params;
            // @ts-expect-error

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, `Could not change active to 'false' for job: ${jobId}`);
            requestHandler(async () => jobsService.setActiveState(jobId, false));
        });

        v1routes.post('/jobs/:jobId/_start', (req, res) => {
            const { jobId } = req.params;
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, `Could not start job: ${jobId}`);
            requestHandler(async () => jobsService.startJob(jobId));
        });

        v1routes.post(['/jobs/:jobId/_stop', '/ex/:exId/_stop'], (req, res) => {
            const {
                timeout,
                blocking = true,
                force = false
            } = req.query as unknown as { timeout: number; blocking: boolean; force: boolean };

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not stop execution');
            requestHandler(async () => {
                const exId = await this._getExIdFromRequest(req as TerasliceRequest);

                await executionService.stopExecution(exId, { timeout, force });

                const statusPromise = this._waitForStop(exId, blocking);

                if (force) {
                    const status = await statusPromise;
                    return {
                        message: `Force stop complete for exId ${exId}`,
                        status: status.status
                    };
                }
                return statusPromise;
            });
        });

        v1routes.post(['/jobs/:jobId/_pause', '/ex/:exId/_pause'], (req, res) => {
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not pause execution');
            requestHandler(async () => {
                const exId = await this._getExIdFromRequest(req as TerasliceRequest);
                return executionService.pauseExecution(exId);
            });
        });

        v1routes.post(['/jobs/:jobId/_resume', '/ex/:exId/_resume'], (req, res) => {
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not resume execution');
            requestHandler(async () => {
                const exId = await this._getExIdFromRequest(req as TerasliceRequest);
                return executionService.resumeExecution(exId);
            });
        });

        v1routes.delete('/jobs/:jobId', (req, res) => {
            const { jobId } = req.params;
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not delete job');
            requestHandler(async () => jobsService.softDeleteJob(jobId));
        });

        v1routes.post('/jobs/:jobId/_recover', (req, res) => {
            const cleanupType = req.query.cleanup_type || req.query.cleanup;
            const { jobId } = req.params;
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not recover job');
            requestHandler(async () => {
                validateCleanupType(cleanupType as RecoveryCleanupType);
                return jobsService.recoverJob(jobId, cleanupType as RecoveryCleanupType);
            });
        });

        v1routes.post('/ex/:exId/_recover', (req, res) => {
            const cleanupType = req.query.cleanup_type || req.query.cleanup;
            const { exId } = req.params;
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not recover execution');
            requestHandler(async () => {
                validateCleanupType(cleanupType as RecoveryCleanupType);
                return executionService.recoverExecution(exId, cleanupType as RecoveryCleanupType);
            });
        });

        v1routes.post(['/jobs/:jobId/_workers', '/ex/:exId/_workers'], (req, res) => {
            const { query } = req;

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not change workers count');
            requestHandler(async () => {
                const exId = await this._getExIdFromRequest(req as TerasliceRequest);
                const result = await this._changeWorkers(exId, query);
                return { message: `${result.workerNum} workers have been ${result.action} for execution: ${result.ex_id}` };
            });
        });

        v1routes.get([
            '/jobs/:jobId/slicer',
            '/jobs/:jobId/controller',
            '/ex/:exId/slicer',
            '/ex/:exId/controller'
        ], (req, res) => {
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get slicer statistics');
            requestHandler(async () => {
                const exId = await this._getExIdFromRequest(req as TerasliceRequest);
                return this._controllerStats(exId);
            });
        });

        v1routes.get([
            '/jobs/:jobId/errors',
            '/jobs/:jobId/errors/:exId',
            '/ex/:exId/errors',
            '/ex/errors',
        ], (req, res) => {
            const { size, from, sort } = getSearchOptions(req as TerasliceRequest);

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get errors for job');
            requestHandler(async () => {
                const exId = await this._getExIdFromRequest(req as TerasliceRequest, true);

                const query = `state:error AND ex_id:"${exId}"`;
                return this.stateStorage.search(query, from, size, sort as string);
            });
        });

        v1routes.get('/ex', (req, res) => {
            const { status = '', deleted = 'false' } = req.query;
            const { size, from, sort } = getSearchOptions(req as TerasliceRequest);

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not retrieve list of execution contexts');
            requestHandler(async () => {
                validateGetDeletedOption(deleted as string);
                const statuses = parseList(status);

                let partialQuery = 'ex_id:*';

                if (statuses.length) {
                    const statusTerms = statuses.map((s) => `_status:"${s}"`).join(' OR ');
                    partialQuery += ` AND (${statusTerms})`;
                }

                const query = addDeletedToQuery(deleted as string, partialQuery);

                return this.executionStorage.search(query, from, size, sort as string);
            });
        });

        v1routes.get('/ex/:exId', (req, res) => {
            const { exId } = req.params;
            // @ts-expect-error
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, `Could not retrieve execution context ${exId}`);
            requestHandler(async () => executionService.getExecutionContext(exId));
        });

        v1routes.get('/cluster/stats', (req, res) => {
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get cluster statistics');
            requestHandler(async () => {
                const stats = executionService.getClusterAnalytics();

                // for backwards compatibility
                // @ts-expect-error
                stats.slicer = stats.controllers;
                return stats;
            });
        });
        v1routes.get(['/cluster/slicers', '/cluster/controllers'], (req, res) => {
            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get execution statistics');
            requestHandler(() => this._controllerStats());
        });

        // backwards compatibility for /v1 routes
        this.app.use(v1routes);
        this.app.use('/v1', v1routes);

        this.app.route('/txt/assets{*splat}')
        // @ts-expect-error
            .get(assetRedirect);

        this.app.get('/txt/workers', (req, res) => {
            const { size, from } = getSearchOptions(req as TerasliceRequest);
            let defaults: string[];
            if (this.clusterType === 'native') {
                defaults = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
            }

            if (this.clusterType === 'kubernetesV2') {
                defaults = ['assignment', 'job_id', 'ex_id', 'node_id', 'pod_name', 'image'];
            }

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get all workers');
            requestHandler(async () => {
                const workers = await executionService.findAllWorkers() as Record<string, any>[];
                return makeTable(req as TerasliceRequest, defaults, workers.slice(from, size));
            });
        });

        this.app.get('/txt/nodes', (req, res) => {
            const { size, from } = getSearchOptions(req as TerasliceRequest);
            const defaults = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get all nodes');
            requestHandler(async () => {
                const nodes = await clusterService.getClusterState();

                const transform = Object.values(nodes)
                    .slice(from, size)
                    .map((node: any) => Object.assign(
                        {},
                        node,
                        { active: node.active.length }
                    ));

                return makeTable(req as TerasliceRequest, defaults, transform);
            });
        });

        this.app.get('/txt/jobs', (req, res) => {
            const { active = '', deleted = 'false' } = req.query;
            const { size, from, sort } = getSearchOptions(req as TerasliceRequest);

            const defaults = ['job_id', 'name', 'active', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get all jobs');
            requestHandler(async () => {
                validateGetDeletedOption(deleted as string);

                if (deleted !== 'false') {
                    defaults.push('_deleted_on');
                }

                const partialQuery = createJobActiveQuery(active as string);
                const query = addDeletedToQuery(deleted as string, partialQuery);

                const jobs = await this.jobsStorage.search(
                    query, from, size, sort as string
                ) as Record<string, any>[];

                return makeTable(req as TerasliceRequest, defaults, jobs);
            });
        });

        this.app.get('/txt/ex', (req, res) => {
            const { deleted = 'false' } = req.query;
            const { size, from, sort } = getSearchOptions(req as TerasliceRequest);

            const defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get all executions');

            requestHandler(async () => {
                validateGetDeletedOption(deleted as string);

                if (deleted !== 'false') {
                    defaults.push('_deleted_on');
                }

                const partialQuery = 'ex_id:*';
                const query = addDeletedToQuery(deleted as string, partialQuery);

                const exs = await this.executionStorage.search(
                    query, from, size, sort as string
                ) as Record<string, any>[];

                return makeTable(req as TerasliceRequest, defaults, exs);
            });
        });

        this.app.get(['/txt/slicers', '/txt/controllers'], (req, res) => {
            const { size, from } = getSearchOptions(req as TerasliceRequest);

            const defaults = [
                'name',
                'job_id',
                'workers_available',
                'workers_active',
                'failed',
                'queued',
                'processed'
            ];

            const requestHandler = handleTerasliceRequest(req as TerasliceRequest, res, 'Could not get all execution statistics');
            requestHandler(async () => {
                const stats = await this._controllerStats();
                return makeTable(req as TerasliceRequest, defaults, stats.slice(from, size));
            });
        });

        // This is a catch all, any none supported api endpoints will return an error
        this.app.route('*splat')
            .all((req, res) => {
                sendError(res, 405, `cannot ${req.method} endpoint ${req.originalUrl}`);
            });

        this.available = true;
        this._updatePromMetrics();
    }

    private async _waitForStop(exId: string, blocking?: boolean): Promise<Record<string, any>> {
        return new Promise((resolve) => {
            const checkExecution = () => {
                this.executionService.getExecutionContext(exId)
                    .then((execution) => {
                        const status = execution._status;
                        const terminalList = this.executionStorage.getTerminalStatuses();
                        const isTerminal = terminalList.find((tStat: string) => tStat === status);
                        if (isTerminal || `${blocking}` !== 'true') {
                            resolve({ status });
                        } else {
                            setTimeout(checkExecution, 3000);
                        }
                    })
                    .catch((err) => {
                        logError(this.logger, err, 'failure waiting for stop');
                        setTimeout(checkExecution, 3000);
                    });
            };

            checkExecution();
        });
    }

    /**
     * Starts an interval if prom metrics is enabled to periodically grab
     * cluster state/info and set metrics.
     * @async
     * @private
     * @function _updatePromMetrics
     * @return {Promise<void>}
     */
    private async _updatePromMetrics() {
        function extractVersionFromImage(image: string): string {
            let version = '';

            if (image.includes(':')) {
                version = image.split(':')[1].split('_')[0];
            }

            return version;
        }

        const { terafoundation, teraslice } = this.context.sysconfig;
        if (terafoundation.prom_metrics_enabled && teraslice.cluster_manager_type !== 'native') {
            try {
                const apiTimeout = 15000;
                const apiTimeoutError = `Unable to verify that prom metrics API is running after ${apiTimeout / 1000} seconds`;
                await pWhile(
                    async () => this.context.apis.foundation.promMetrics.verifyAPI(),
                    { timeoutMs: apiTimeout, error: apiTimeoutError }
                );
            } catch (err) {
                this.logger.error(err);
            }
            /// Interval is hardcoded to refresh metrics every 10 seconds
            if (this.context.apis.foundation.promMetrics.verifyAPI()) {
                setInterval(async () => {
                    this.context.apis.foundation.promMetrics.resetMetrics();
                    try {
                        this.logger.trace('Updating cluster_master prom metrics..');
                        const controllers = await this.executionService.getControllerStats();
                        const stats = this.executionService.getClusterAnalytics();
                        const { cluster_manager_type, name } = this.context.sysconfig.teraslice;

                        this.context.apis.foundation.promMetrics.set(
                            'master_info',
                            {
                                arch: this.context.arch,
                                clustering_type: cluster_manager_type,
                                name,
                                node_version: process.version,
                                platform: this.context.platform,
                                teraslice_version: `v${terasliceVersion}`
                            },
                            1
                        );

                        this.context.apis.foundation.promMetrics.set(
                            'slices_processed',
                            {},
                            stats.controllers.processed
                        );

                        this.context.apis.foundation.promMetrics.set(
                            'slices_failed',
                            {},
                            stats.controllers.failed
                        );

                        this.context.apis.foundation.promMetrics.set(
                            'slices_queued',
                            {},
                            stats.controllers.queued
                        );

                        this.context.apis.foundation.promMetrics.set(
                            'workers_joined',
                            {},
                            stats.controllers.workers_joined
                        );

                        this.context.apis.foundation.promMetrics.set(
                            'workers_disconnected',
                            {},
                            stats.controllers.workers_disconnected
                        );

                        this.context.apis.foundation.promMetrics.set(
                            'workers_reconnected',
                            {},
                            stats.controllers.workers_reconnected
                        );

                        for (const controller of controllers) {
                            const controllerLabels = {
                                ex_id: controller.ex_id,
                                job_id: controller.job_id,
                                job_name: controller.name
                            };

                            this.context.apis.foundation.promMetrics.set(
                                'controller_workers_active',
                                controllerLabels,
                                controller.workers_active
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'controller_workers_available',
                                controllerLabels,
                                controller.workers_available
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'controller_workers_joined',
                                controllerLabels,
                                controller.workers_joined
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'controller_workers_reconnected',
                                controllerLabels,
                                controller.workers_reconnected
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'controller_workers_disconnected',
                                controllerLabels,
                                controller.workers_disconnected
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'controller_slices_processed',
                                controllerLabels,
                                controller.processed
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'controller_slices_failed',
                                controllerLabels,
                                controller.failed
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'controller_slices_queued',
                                controllerLabels,
                                controller.queued
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'controller_slicers_count',
                                controllerLabels,
                                controller.slicers
                            );
                        }
                        const query = this.executionStorage.getLivingStatuses().map((str) => `_status:${str}`)
                            .join(' OR ');
                        const exList = await this.executionStorage.search(query, undefined, 10000);
                        for (const ex of exList) {
                            const controllerLabels = {
                                ex_id: ex.ex_id,
                                job_id: ex.job_id,
                                job_name: ex.name
                            };
                            if (ex.resources_requests_cpu) {
                                this.context.apis.foundation.promMetrics.set(
                                    'execution_cpu_request',
                                    controllerLabels,
                                    ex.resources_requests_cpu
                                );
                            }
                            if (ex.resources_limits_cpu) {
                                this.context.apis.foundation.promMetrics.set(
                                    'execution_cpu_limit',
                                    controllerLabels,
                                    ex.resources_limits_cpu
                                );
                            }
                            if (ex.resources_requests_memory) {
                                this.context.apis.foundation.promMetrics.set(
                                    'execution_memory_request',
                                    controllerLabels,
                                    ex.resources_requests_memory
                                );
                            }
                            if (ex.resources_limits_memory) {
                                this.context.apis.foundation.promMetrics.set(
                                    'execution_memory_limit',
                                    controllerLabels,
                                    ex.resources_limits_memory
                                );
                            }
                            this.context.apis.foundation.promMetrics.set(
                                'execution_created_timestamp_seconds',
                                controllerLabels,
                                new Date(ex._created).getTime() / 1000
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'execution_updated_timestamp_seconds',
                                controllerLabels,
                                new Date(ex._updated).getTime() / 1000
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'execution_slicers',
                                controllerLabels,
                                ex.slicers
                            );
                            this.context.apis.foundation.promMetrics.set(
                                'execution_workers',
                                controllerLabels,
                                ex.workers
                            );
                            for (const status in ExecutionStatusEnum) {
                                if (
                                    isKey(ExecutionStatusEnum, status)
                                ) {
                                    const statusLabels = {
                                        ...controllerLabels,
                                        status: ExecutionStatusEnum[status]
                                    };
                                    let state: number;
                                    if (ExecutionStatusEnum[status] === ex._status) {
                                        state = 1;
                                    } else {
                                        state = 0;
                                    }
                                    this.context.apis.foundation.promMetrics.set(
                                        'execution_status',
                                        statusLabels,
                                        state
                                    );
                                }
                            }
                        }

                        // TODO: removing native clustering will remove the need for any here
                        const clusterState = this.clusterService.getClusterState() as any;

                        /// Filter out information about kubernetes ex pods
                        const filteredExecutions: Record<string, string> = {};
                        for (const node in clusterState) {
                            if (clusterState[node].active) {
                                for (const worker of clusterState[node].active) {
                                    if (worker.ex_id && !filteredExecutions[worker.ex_id]) {
                                        filteredExecutions[worker.ex_id] = worker.ex_id;
                                        const exLabel = {
                                            ex_id: worker.ex_id,
                                            job_id: worker.job_id,
                                            image: worker.image,
                                            version: extractVersionFromImage(worker.image)

                                        };
                                        this.context.apis.foundation.promMetrics.set(
                                            'execution_info',
                                            exLabel,
                                            1
                                        );
                                    }
                                }
                            }
                        }

                        this.logger.trace('Updated cluster_master prom metrics..');
                    } catch (err) {
                        this.logger.error(err, 'Unable to update cluster_master prom metrics.');
                    }
                }, 10000);
            } else {
                console.warn('Unable to trigger cluster_master prom Metrics interval due to inactive Prom Metrics API');
            }
        }
    }
}
