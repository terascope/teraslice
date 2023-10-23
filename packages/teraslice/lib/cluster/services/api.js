'use strict';

const { Router } = require('express');
const bodyParser = require('body-parser');
const { pipeline: streamPipeline } = require('node:stream/promises');
const { RecoveryCleanupType } = require('@terascope/job-components');
const {
    parseErrorInfo, parseList, logError, TSError, startsWith
} = require('@terascope/utils');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const {
    makePrometheus,
    isPrometheusRequest,
    makeTable,
    sendError,
    handleRequest,
    getSearchOptions,
} = require('../../utils/api_utils');
const terasliceVersion = require('../../../package.json').version;

let gotESMModule;

async function getGotESM() {
    if (gotESMModule) return gotESMModule;
    const module = await import('gotESM'); // eslint-disable-line
    gotESMModule = module.default;
    return module.default;
}

module.exports = function apiService(context, { assetsUrl, app }) {
    const clusterConfig = context.sysconfig.teraslice;
    const clusterType = clusterConfig.cluster_manager_type;

    const logger = makeLogger(context, 'api_service');

    let available = false;
    let executionService;
    let jobsService;
    let stateStore;
    let clusterService;
    let exStore;
    let jobStore;

    const v1routes = new Router();

    app.use(bodyParser.json({
        type(req) {
            return (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded');
        }
    }));

    app.use((err, req, res, next) => {
        if (err instanceof SyntaxError) {
            sendError(res, 400, 'the json submitted is malformed');
        } else {
            next();
        }
    });

    app.use((req, res, next) => {
        if (!available) {
            res.json({ error: 'api is not available' });
            return;
        }
        req.logger = logger;
        next();
    });

    app.set('json spaces', 4);

    v1routes.get('/', (req, res) => {
        const requestHandler = handleRequest(req, res);
        requestHandler(() => ({
            arch: context.arch,
            clustering_type: context.sysconfig.teraslice.cluster_manager_type,
            name: context.sysconfig.teraslice.name,
            node_version: process.version,
            platform: context.platform,
            teraslice_version: `v${terasliceVersion}`
        }));
    });

    v1routes.get('/cluster/state', (req, res) => {
        const requestHandler = handleRequest(req, res);
        requestHandler(() => clusterService.getClusterState());
    });

    v1routes.route('/assets*')
        .delete((req, res) => {
            _redirect(req, res);
        })
        .post((req, res) => {
            if (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                sendError(res, 400, '/asset endpoints do not accept json');
                return;
            }
            _redirect(req, res);
        })
        .get(_redirect);

    v1routes.post('/jobs', (req, res) => {
        // if no job was posted an empty object is returned, so we check if it has values
        if (!req.body.operations) {
            sendError(res, 400, 'No job was posted');
            return;
        }

        const { start } = req.query;
        const jobSpec = req.body;
        const shouldRun = `${start}` !== 'false';

        const requestHandler = handleRequest(req, res, 'Job submission failed');
        requestHandler(() => jobsService.submitJob(jobSpec, shouldRun));
    });

    v1routes.get('/jobs', (req, res) => {
        let query;
        const { size, from, sort } = getSearchOptions(req);

        if (req.query.active === 'true') {
            query = 'job_id:* AND !active:false';
        } else if (req.query.active === 'false') {
            query = 'job_id:* AND active:false';
        } else {
            query = 'job_id:*';
        }

        const requestHandler = handleRequest(req, res, 'Could not retrieve list of jobs');
        requestHandler(() => jobStore.search(query, from, size, sort));
    });

    v1routes.get('/jobs/:jobId', (req, res) => {
        const { jobId } = req.params;

        const requestHandler = handleRequest(req, res, 'Could not retrieve job');
        requestHandler(async () => jobStore.get(jobId));
    });

    v1routes.put('/jobs/:jobId', (req, res) => {
        const { jobId } = req.params;
        const jobSpec = req.body;

        if (Object.keys(jobSpec).length === 0) {
            sendError(res, 400, `no data was provided to update job ${jobId}`);
            return;
        }

        const requestHandler = handleRequest(req, res, 'Could not update job');
        requestHandler(async () => jobsService.updateJob(jobId, jobSpec));
    });

    v1routes.get('/jobs/:jobId/ex', (req, res) => {
        const { jobId } = req.params;

        const requestHandler = handleRequest(req, res, 'Could not retrieve list of execution contexts');
        requestHandler(async () => jobsService.getLatestExecution(jobId));
    });

    v1routes.post('/jobs/:jobId/_active', (req, res) => {
        const { jobId } = req.params;

        const requestHandler = handleRequest(req, res, `Could not change active to 'true' for job: ${jobId}`);
        requestHandler(async () => jobsService.setActiveState(jobId, true));
    });

    v1routes.post('/jobs/:jobId/_inactive', (req, res) => {
        const { jobId } = req.params;

        const requestHandler = handleRequest(req, res, `Could not change active to 'false' for job: ${jobId}`);
        requestHandler(async () => jobsService.setActiveState(jobId, false));
    });

    v1routes.post('/jobs/:jobId/_start', (req, res) => {
        const { jobId } = req.params;

        const requestHandler = handleRequest(req, res, `Could not start job: ${jobId}`);
        requestHandler(async () => jobsService.startJob(jobId));
    });

    v1routes.post(['/jobs/:jobId/_stop', '/ex/:exId/_stop'], (req, res) => {
        const { timeout, blocking = true } = req.query;

        const requestHandler = handleRequest(req, res, 'Could not stop execution');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req);
            await executionService.stopExecution(exId, timeout);
            return _waitForStop(exId, blocking);
        });
    });

    v1routes.post(['/jobs/:jobId/_pause', '/ex/:exId/_pause'], (req, res) => {
        const requestHandler = handleRequest(req, res, 'Could not pause execution');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req);
            return executionService.pauseExecution(exId);
        });
    });

    v1routes.post(['/jobs/:jobId/_resume', '/ex/:exId/_resume'], (req, res) => {
        const requestHandler = handleRequest(req, res, 'Could not resume execution');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req);
            return executionService.resumeExecution(exId);
        });
    });

    function validateCleanupType(cleanupType) {
        if (cleanupType && !RecoveryCleanupType[cleanupType]) {
            const types = Object.values(RecoveryCleanupType);
            throw new TSError(`cleanup_type must be empty or set to ${types.join(', ')}`, {
                statusCode: 400
            });
        }
    }

    v1routes.post('/jobs/:jobId/_recover', (req, res) => {
        const cleanupType = req.query.cleanup_type || req.query.cleanup;
        const { jobId } = req.params;

        const requestHandler = handleRequest(req, res, 'Could not recover job');
        requestHandler(async () => {
            validateCleanupType(cleanupType);
            return jobsService.recoverJob(jobId, cleanupType);
        });
    });

    v1routes.post('/ex/:exId/_recover', (req, res) => {
        const cleanupType = req.query.cleanup_type || req.query.cleanup;
        const { exId } = req.params;

        const requestHandler = handleRequest(req, res, 'Could not recover execution');
        requestHandler(async () => {
            validateCleanupType(cleanupType);
            return executionService.recoverExecution(exId, cleanupType);
        });
    });

    v1routes.post(['/jobs/:jobId/_workers', '/ex/:exId/_workers'], (req, res) => {
        const { query } = req;

        const requestHandler = handleRequest(req, res, 'Could not change workers count');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req);
            const result = await _changeWorkers(exId, query);
            return { message: `${result.workerNum} workers have been ${result.action} for execution: ${result.ex_id}` };
        });
    });

    v1routes.get([
        '/jobs/:jobId/slicer',
        '/jobs/:jobId/controller',
        '/ex/:exId/slicer',
        '/ex/:exId/controller'
    ], (req, res) => {
        const requestHandler = handleRequest(req, res, 'Could not get slicer statistics');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req);
            return _controllerStats(exId);
        });
    });

    v1routes.get([
        '/jobs/:jobId/errors',
        '/jobs/:jobId/errors/:exId',
        '/ex/:exId/errors',
        '/ex/errors',
    ], (req, res) => {
        const { size, from, sort } = getSearchOptions(req);

        const requestHandler = handleRequest(req, res, 'Could not get errors for job');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req, true);

            const query = `state:error AND ex_id:"${exId}"`;
            return stateStore.search(query, from, size, sort);
        });
    });

    v1routes.get('/ex', (req, res) => {
        const { status = '' } = req.query;
        const { size, from, sort } = getSearchOptions(req);

        const requestHandler = handleRequest(req, res, 'Could not retrieve list of execution contexts');
        requestHandler(async () => {
            const statuses = parseList(status);

            let query = 'ex_id:*';

            if (statuses.length) {
                const statusTerms = statuses.map((s) => `_status:"${s}"`).join(' OR ');
                query += ` AND (${statusTerms})`;
            }

            return exStore.search(query, from, size, sort);
        });
    });

    v1routes.get('/ex/:exId', (req, res) => {
        const { exId } = req.params;

        const requestHandler = handleRequest(req, res, `Could not retrieve execution context ${exId}`);
        requestHandler(async () => executionService.getExecutionContext(exId));
    });

    v1routes.get('/cluster/stats', (req, res) => {
        const { name: cluster } = context.sysconfig.teraslice;

        const requestHandler = handleRequest(req, res, 'Could not get cluster statistics');
        requestHandler(async () => {
            const stats = await executionService.getClusterAnalytics();

            if (isPrometheusRequest(req)) return makePrometheus(stats, { cluster });
            // for backwards compatability (unsupported for prometheus)
            stats.slicer = stats.controllers;
            return stats;
        });
    });

    v1routes.get(['/cluster/slicers', '/cluster/controllers'], (req, res) => {
        const requestHandler = handleRequest(req, res, 'Could not get execution statistics');
        requestHandler(() => _controllerStats());
    });

    // backwards compatibility for /v1 routes
    app.use(v1routes);
    app.use('/v1', v1routes);

    app.route('/txt/assets*')
        .get(_redirect);

    app.get('/txt/workers', (req, res) => {
        const { size, from } = getSearchOptions(req);
        let defaults;
        if (clusterType === 'native') {
            defaults = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
        }

        if (clusterType === 'kubernetes') {
            defaults = ['assignment', 'job_id', 'ex_id', 'node_id', 'pod_name', 'image'];
        }

        const requestHandler = handleRequest(req, res, 'Could not get all workers');
        requestHandler(async () => {
            const workers = await executionService.findAllWorkers();
            return makeTable(req, defaults, workers.slice(from, size));
        });
    });

    app.get('/txt/nodes', (req, res) => {
        const { size, from } = getSearchOptions(req);
        const defaults = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];

        const requestHandler = handleRequest(req, res, 'Could not get all nodes');
        requestHandler(async () => {
            const nodes = await clusterService.getClusterState();

            const transform = Object.values(nodes)
                .slice(from, size)
                .map((node) => Object.assign(
                    {},
                    node,
                    { active: node.active.length }
                ));

            return makeTable(req, defaults, transform);
        });
    });

    app.get('/txt/jobs', (req, res) => {
        let query;
        const { size, from, sort } = getSearchOptions(req);

        const defaults = ['job_id', 'name', 'active', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];

        if (req.query.active === 'true') {
            query = 'job_id:* AND !active:false';
        } else if (req.query.active === 'false') {
            query = 'job_id:* AND active:false';
        } else {
            query = 'job_id:*';
        }

        const requestHandler = handleRequest(req, res, 'Could not get all jobs');
        requestHandler(async () => {
            const jobs = await jobStore.search(query, from, size, sort);
            return makeTable(req, defaults, jobs);
        });
    });

    app.get('/txt/ex', (req, res) => {
        const { size, from, sort } = getSearchOptions(req);

        const defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        const query = 'ex_id:*';

        const requestHandler = handleRequest(req, res, 'Could not get all executions');
        requestHandler(async () => {
            const exs = await exStore.search(query, from, size, sort);
            return makeTable(req, defaults, exs);
        });
    });

    app.get(['/txt/slicers', '/txt/controllers'], (req, res) => {
        const { size, from } = getSearchOptions(req);

        const defaults = [
            'name',
            'job_id',
            'workers_available',
            'workers_active',
            'failed',
            'queued',
            'processed'
        ];

        const requestHandler = handleRequest(req, res, 'Could not get all execution statistics');
        requestHandler(async () => {
            const stats = await _controllerStats();
            return makeTable(req, defaults, stats.slice(from, size));
        });
    });

    // This is a catch all, any none supported api endpoints will return an error
    app.route('*')
        .all((req, res) => {
            sendError(res, 405, `cannot ${req.method} endpoint ${req.originalUrl}`);
        });

    async function _changeWorkers(exId, query) {
        let msg;
        let workerNum;
        const keyOptions = { add: true, remove: true, total: true };
        const queryKeys = Object.keys(query);

        if (!query) {
            throw new TSError('Must provide a query parameter in request', {
                statusCode: 400
            });
        }

        queryKeys.forEach((key) => {
            if (keyOptions[key]) {
                msg = key;
                workerNum = Number(query[key]);
            }
        });

        if (!msg || Number.isNaN(workerNum) || workerNum <= 0) {
            throw new TSError('Must provide a valid worker parameter(add/remove/total) that is a number and greater than zero', {
                statusCode: 400
            });
        }

        if (msg === 'add') {
            return executionService.addWorkers(exId, workerNum);
        }

        if (msg === 'remove') {
            return executionService.removeWorkers(exId, workerNum);
        }

        return executionService.setWorkers(exId, workerNum);
    }

    async function _getExIdFromRequest(req, allowWildcard = false) {
        const { path } = req;
        if (startsWith(path, '/ex')) {
            const { exId } = req.params;
            if (exId) return exId;

            if (allowWildcard) {
                return '*';
            }
            const error = new Error('Execution Context ID is required');
            error.code = 406;
            throw error;
        }

        if (startsWith(path, '/jobs')) {
            const { jobId } = req.params;
            const exId = await jobsService.getLatestExecutionId(jobId);
            if (!exId) {
                const error = new Error(`No executions were found for job: ${jobId}`);
                error.code = 404;
                throw error;
            }
            return exId;
        }

        const error = new Error('Only /ex and /jobs are allowed');
        error.code = 405;
        throw error;
    }

    async function _redirect(req, res) {
        const module = await getGotESM();
        const options = {
            prefixUrl: assetsUrl,
            headers: req.headers,
            searchParams: req.query,
            throwHttpErrors: false,
            timeout: { request: clusterConfig.api_response_timeout },
            decompress: false,
            retry: { limit: 0 }
        };

        const uri = req.url.replace(/^\//, '');
        const method = req.method.toLowerCase();

        try {
            await streamPipeline(
                req,
                module.stream[method](uri, options),
                res,
            );
        } catch (err) {
            const { statusCode, message } = parseErrorInfo(err, {
                defaultErrorMsg: 'Asset Service error while processing request'
            });
            sendError(res, statusCode, message, req.logger);
        }
    }

    async function _controllerStats(exId) {
        return executionService.getControllerStats(exId);
    }

    async function shutdown() {
        logger.info('shutting down api service');
    }

    async function initialize() {
        logger.info('api service is initializing...');

        stateStore = context.stores.state;
        exStore = context.stores.execution;
        jobStore = context.stores.jobs;
        if (stateStore == null || exStore == null || jobStore == null) {
            throw new Error('Missing required stores');
        }

        executionService = context.services.execution;
        jobsService = context.services.jobs;
        clusterService = context.services.cluster;

        if (jobsService == null || executionService == null || clusterService == null) {
            throw new Error('Missing required services');
        }

        available = true;
    }

    function _waitForStop(exId, blocking) {
        return new Promise((resolve) => {
            function checkExecution() {
                executionService.getExecutionContext(exId)
                    .then((execution) => {
                        const status = execution._status;
                        const terminalList = exStore.getTerminalStatuses();
                        const isTerminal = terminalList.find((tStat) => tStat === status);
                        if (isTerminal || `${blocking}` !== 'true') {
                            resolve({ status });
                        } else {
                            setTimeout(checkExecution, 3000);
                        }
                    })
                    .catch((err) => {
                        logError(logger, err, 'failure waiting for stop');
                        setTimeout(checkExecution, 3000);
                    });
            }

            checkExecution();
        });
    }

    return {
        initialize,
        shutdown,
    };
};
