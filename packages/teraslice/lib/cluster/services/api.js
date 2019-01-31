'use strict';

const _ = require('lodash');
const { Router } = require('express');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const request = require('request');
const { parseErrorInfo } = require('@terascope/utils');
const {
    makePrometheus,
    isPrometheusRequest,
    makeTable,
    sendError,
    handleRequest,
    getSearchOptions,
} = require('../../utils/api_utils');
const makeStateStore = require('../storage/state');
const terasliceVersion = require('../../../package.json').version;

module.exports = async function makeAPI(context, app, options) {
    const { assetsUrl, stateStore: _stateStore } = options;
    const logger = context.apis.foundation.makeLogger({ module: 'api_service' });
    const executionService = context.services.execution;
    const jobsService = context.services.jobs;
    const v1routes = new Router();
    const stateStore = _stateStore || await makeStateStore(context);

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
        requestHandler(() => executionService.getClusterState());
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
        const shouldRun = start !== 'false';

        const requestHandler = handleRequest(req, res, 'Job submission failed');
        requestHandler(() => jobsService.submitJob(jobSpec, shouldRun));
    });

    v1routes.get('/jobs', (req, res) => {
        const { size, from, sort } = getSearchOptions(req);

        const requestHandler = handleRequest(req, res, 'Could not retrieve list of jobs');
        requestHandler(() => jobsService.getJobs(from, size, sort));
    });

    v1routes.get('/jobs/:jobId', (req, res) => {
        const { jobId } = req.params;

        const requestHandler = handleRequest(req, res, 'Could not retrieve job');
        requestHandler(async () => jobsService.getJob(jobId));
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
            await executionService.getActiveExecution(exId);
            return executionService.pauseExecution(exId);
        });
    });

    v1routes.post(['/jobs/:jobId/_resume', '/ex/:exId/_resume'], (req, res) => {
        const requestHandler = handleRequest(req, res, 'Could not resume execution');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req);
            await executionService.getActiveExecution(exId);
            return executionService.resumeExecution(exId);
        });
    });

    v1routes.post(['/jobs/:jobId/_recover', '/ex/:exId/_recover'], (req, res) => {
        const { cleanup } = req.query;

        if (cleanup && !(cleanup === 'all' || cleanup === 'errors')) {
            const errorMsg = 'if cleanup is specified it must be set to "all" or "errors"';
            res.status(400).json({ error: errorMsg });
            return;
        }

        const requestHandler = handleRequest(req, res, 'Could not recover execution');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req);
            return executionService.recoverExecution(exId, cleanup);
        });
    });

    v1routes.post(['/jobs/:jobId/_workers', '/ex/:exId/_workers'], (req, res) => {
        const { query } = req;

        const requestHandler = handleRequest(req, res, 'Could not change workers count');
        requestHandler(async () => {
            const exId = await _getExIdFromRequest(req);
            const result = await _changeWorkers(exId, query);
            return `${result.workerNum} workers have been ${result.action} for execution: ${result.ex_id}`;
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

            const query = `state:error AND ex_id:${exId}`;
            return stateStore.search(query, from, size, sort);
        });
    });

    v1routes.get('/ex', (req, res) => {
        const { status = '' } = req.query;
        const { size, from, sort } = getSearchOptions(req);

        const requestHandler = handleRequest(req, res, 'Could not retrieve list of execution contexts');
        requestHandler(async () => {
            const statuses = status.split(',').map(s => s.trim()).filter(s => !!s);

            let query = 'ex_id:*';

            if (statuses.length) {
                const statusTerms = statuses.map(s => `_status:${s}`).join(' OR ');
                query += ` AND (${statusTerms})`;
            }

            return executionService.searchExecutionContexts(query, from, size, sort);
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
            const stats = await executionService.getClusterStats();

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
        const defaults = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];

        const requestHandler = handleRequest(req, res, 'Could not get all workers');
        requestHandler(async () => {
            const workers = await executionService.findAllWorkers();
            return makeTable(req, defaults, workers);
        });
    });

    app.get('/txt/nodes', (req, res) => {
        const defaults = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];

        const requestHandler = handleRequest(req, res, 'Could not get all nodes');
        requestHandler(async () => {
            const nodes = await executionService.getClusterState();

            const transform = _.map(nodes, (node) => {
                node.active = node.active.length;
                return node;
            });

            return makeTable(req, defaults, transform);
        });
    });

    app.get('/txt/jobs', (req, res) => {
        const { size, from, sort } = getSearchOptions(req);

        const defaults = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];

        const requestHandler = handleRequest(req, res, 'Could not get all jobs');
        requestHandler(async () => {
            const jobs = await jobsService.getJobs(from, size, sort);
            return makeTable(req, defaults, jobs);
        });
    });

    app.get('/txt/ex', (req, res) => {
        const { size, from, sort } = getSearchOptions(req);

        const defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        const query = 'ex_id:*';

        const requestHandler = handleRequest(req, res, 'Could not get all executions');
        requestHandler(async () => {
            const exs = await executionService.searchExecutionContexts(query, from, size, sort);
            return makeTable(req, defaults, exs);
        });
    });

    app.get(['/txt/slicers', '/txt/controllers'], (req, res) => {
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
            return makeTable(req, defaults, stats);
        });
    });

    // This is a catch all, any none supported api endpoints will return an error
    app.route('*')
        .all((req, res) => {
            sendError(res, 405, `cannot ${req.method} endpoint ${req.originalUrl}`);
        });

    function _changeWorkers(exId, query) {
        let msg;
        let workerNum;
        const keyOptions = { add: true, remove: true, total: true };
        const queryKeys = Object.keys(query);

        if (!query) {
            const error = new Error('Must provide a query parameter in request');
            error.code = 400;
            return Promise.reject(error);
        }

        queryKeys.forEach((key) => {
            if (keyOptions[key]) {
                msg = key;
                workerNum = Number(query[key]);
            }
        });

        if (!msg || isNaN(workerNum) || workerNum <= 0) {
            const error = new Error('Must provide a valid worker parameter(add/remove/total) that is a number and greater than zero');
            error.code = 400;
            return Promise.reject(error);
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
        if (_.startsWith(path, '/ex')) {
            const { exId } = req.params;
            if (exId) return exId;

            if (allowWildcard) {
                return '*';
            }
            const error = new Error('Execution Context ID is required');
            error.code = 406;
            throw error;
        }

        if (_.startsWith(path, '/jobs')) {
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

    function _redirect(req, res) {
        const reqOptions = {
            method: req.method,
            url: req.url,
            baseUrl: assetsUrl,
        };

        reqOptions.headers = req.headers;
        reqOptions.qs = req.query;

        req.pipe(
            request(reqOptions)
                .on('response', (response) => {
                    res.headers = response.headers;
                    res.status(response.statusCode);
                    response.pipe(res);
                })
        ).on('error', (err) => {
            const { statusCode, message } = parseErrorInfo(err, {
                defaultErrorMsg: 'Asset Service error while processing request'
            });
            res.status(statusCode).json({
                error: message
            });
        });
    }

    function _controllerStats(exId) {
        return executionService.getControllerStats(exId);
    }

    function shutdown() {
        logger.info('shutting down');
        return Promise.resolve(true);
    }

    function _waitForStop(exId, blocking) {
        return new Promise((resolve) => {
            function checkExecution() {
                executionService.getExecutionContext(exId)
                    .then((execution) => {
                        const terminalList = executionService.terminalStatusList();
                        const isTerminal = terminalList.find(tStat => tStat === execution._status);
                        if (isTerminal || !(blocking === true || blocking === 'true')) {
                            resolve({ status: execution._status });
                        } else {
                            setTimeout(checkExecution, 3000);
                        }
                    })
                    .catch((err) => {
                        logger.error(err);
                        setTimeout(checkExecution, 3000);
                    });
            }

            checkExecution();
        });
    }

    logger.info('api service is initializing...');

    return {
        shutdown,
    };
};
