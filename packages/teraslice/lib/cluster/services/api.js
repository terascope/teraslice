'use strict';

const _ = require('lodash');
const { Router } = require('express');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const request = require('request');
const util = require('util');
const {
    makePrometheus, makeTable, sendError, handleError
} = require('../../utils/api_utils');
const terasliceVersion = require('../../../package.json').version;

module.exports = function module(context, app, { assetsUrl }) {
    const logger = context.apis.foundation.makeLogger({ module: 'api_service' });
    const executionService = context.services.execution;
    const jobsService = context.services.jobs;
    const v1routes = new Router();
    let stateStore;

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

    app.set('json spaces', 4);

    v1routes.get('/', (req, res) => {
        const responseObj = {
            arch: context.arch,
            clustering_type: context.sysconfig.teraslice.cluster_manager_type,
            name: context.sysconfig.teraslice.name,
            node_version: process.version,
            platform: context.platform,
            teraslice_version: terasliceVersion
        };
        res.status(200).json(responseObj);
    });

    v1routes.get('/cluster/state', (req, res) => {
        res.status(200).json(executionService.getClusterState());
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
        } else {
            const jobSpec = req.body;
            let shouldRun = true;

            if (req.query.start && req.query.start === 'false') {
                shouldRun = false;
            }
            logger.trace(`POST /jobs endpoint has received shouldRun: ${shouldRun}, job:`, jobSpec);
            const handleApiError = handleError(res, logger, 500, 'Job submission failed');

            jobsService.submitJob(jobSpec, shouldRun)
                .then((ids) => {
                    res.status(202).json(ids);
                })
                .catch(handleApiError);
        }
    });

    v1routes.get('/jobs', (req, res) => {
        const { from, size, sort } = req.query;

        logger.trace(`GET /jobs endpoint has been called, from: ${from}, size: ${size}, sort: ${sort}`);
        const handleApiError = handleError(res, logger, 500, 'Could not retrieve list of jobs');

        jobsService.getJobs(from, size, sort)
            .then((results) => {
                res.status(200).json(results);
            })
            .catch(handleApiError);
    });

    v1routes.get('/jobs/:job_id', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.trace(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, 'Could not retrieve job');

        jobsService.getJob(jobId)
            .then(jobSpec => res.status(200).json(jobSpec))
            .catch(handleApiError);
    });

    v1routes.put('/jobs/:job_id', (req, res) => {
        const { job_id: jobId } = req.params;
        const jobSpec = req.body;
        if (Object.keys(jobSpec).length === 0) {
            sendError(res, 400, `no data was provided to update job ${jobId}`);
            return;
        }
        logger.trace(`PUT /jobs/:job_id endpoint has been called, job_id: ${jobId}, update changes: `, jobSpec);
        const handleApiError = handleError(res, logger, 500, 'Could not update job');

        jobsService.updateJob(jobId, jobSpec)
            .then(status => res.status(200).json(status))
            .catch(handleApiError);
    });

    v1routes.get('/jobs/:job_id/ex', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.trace(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, 'Could not retrieve list of execution contexts');

        jobsService.getLatestExecution(jobId)
            .then(execution => res.status(200).json(execution))
            .catch(handleApiError);
    });

    v1routes.post('/jobs/:job_id/_start', (req, res) => {
        const { job_id: jobId } = req.params;
        if (!jobId) {
            sendError(res, 400, 'no job_id was posted');
            return;
        }
        logger.trace(`GET /jobs/:job_id/_start endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not start job: ${jobId}`);

        jobsService.startJob(jobId)
            .then(ids => res.status(200).json(ids))
            .catch(handleApiError);
    });

    v1routes.post('/jobs/:job_id/_stop', (req, res) => {
        const { query: { timeout, blocking = true }, params: { job_id: jobId } } = req;
        logger.trace(`POST /jobs/:job_id/_stop endpoint has been called, job_id: ${jobId}, removing any pending workers for the job`);

        const handleApiError = handleError(res, logger, 500, `Could not stop execution for job: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => executionService.stopExecution(exId, timeout)
                .then(() => _waitForStop(exId, blocking))
                .then(status => res.status(200).json({ status })))
            .catch(handleApiError);
    });

    v1routes.post('/jobs/:job_id/_pause', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.trace(`POST /jobs/:job_id/_pause endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not pause execution for job: ${jobId}`);

        jobsService.pauseJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch(handleApiError);
    });

    v1routes.post('/jobs/:job_id/_resume', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.trace(`POST /jobs/:job_id/_resume endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not resume execution for job: ${jobId}`);

        jobsService.resumeJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch(handleApiError);
    });

    v1routes.post('/jobs/:job_id/_recover', (req, res) => {
        const { params: { job_id: jobId }, query: { cleanup } } = req;
        logger.trace(`POST /jobs/:job_id/_recover endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not recover execution for job: ${jobId}`);

        if (cleanup && !(cleanup === 'all' || cleanup === 'errors')) {
            res.status(400).json({ error: 'if cleanup is specified it must be set to "all" or "errors"' });
            return;
        }

        jobsService.recoverJob(jobId, cleanup)
            .then(status => res.status(200).json({ status }))
            .catch(handleApiError);
    });

    v1routes.post('/jobs/:job_id/_workers', (req, res) => {
        const { query, params: { job_id: jobId } } = req;
        logger.trace('POST /jobs/:job_id/_workers endpoint has been called, query:', query);
        const handleApiError = handleError(res, logger, 500, `Could not change workers for job: ${jobId}`);

        _changeWorkers('job', jobId, query)
            .then(responseObj => res.status(200).send(`${responseObj.workerNum} workers have been ${responseObj.action} for execution: ${responseObj.ex_id}`))
            .catch(handleApiError);
    });

    v1routes.get('/jobs/:job_id/slicer', _deprecateSlicerName((req, res) => {
        const { job_id: jobId } = req.params;
        logger.trace(`GET /jobs/:job_id/slicer endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not get slicer statistics for job: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => _controllerStats(exId))
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    }));

    v1routes.get('/jobs/:job_id/controller', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.trace(`GET /jobs/:job_id/controller endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not get controller statistics for job: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => _controllerStats(exId))
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    });

    v1routes.get('/jobs/:job_id/errors/', (req, res) => {
        const { query: { size = 10000, from }, params: { job_id: jobId } } = req;
        const handleApiError = handleError(res, logger, 500, `Could not get errors for job: ${jobId}`);

        logger.trace(`GET /jobs/:job_id/errors endpoint has been called, job_id: ${jobId}, from: ${from}, size: ${size}`);

        jobsService.getLatestExecutionId(jobId)
            .then((exId) => {
                if (!exId) {
                    return Promise.reject(`no executions were found for job: ${jobId}`);
                }
                const query = `state:error AND ex_id:${exId}`;
                return stateStore.search(query, from, size, '_updated:asc');
            })
            .then(errorStates => res.status(200).json(errorStates))
            .catch(handleApiError);
    });

    v1routes.get('/jobs/:job_id/errors/:ex_id', (req, res) => {
        const { params: { job_id: jobId, ex_id: exId }, query: { from, size = 10000 } } = req;
        const handleApiError = handleError(res, logger, 500, `Could not get errors for job: ${jobId}, execution: ${exId}`);

        logger.trace(`GET /jobs/:job_id/errors endpoint has been called, job_id: ${jobId}, ex_id: ${exId}, from: ${from}, size: ${size}`);

        const query = `ex_id:${exId} AND state:error`;

        stateStore.search(query, from, size, '_updated:asc')
            .then((errorStates) => {
                res.status(200).json(errorStates);
            })
            .catch(handleApiError);
    });

    v1routes.get('/ex', (req, res) => {
        const { status, from, size, sort } = req.query;  //eslint-disable-line
        const handleApiError = handleError(res, logger, 500, 'Could not retrieve list of execution contexts');

        logger.trace(`GET /ex endpoint has been called, status: ${status}, from: ${from}, size: ${size}, sort: ${sort}`);
        let query = 'ex_id:*';
        if (status) query += ` AND _status:${status}`;

        executionService.searchExecutionContexts(query, from, size, sort)
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    });

    v1routes.get('/ex/:ex_id', (req, res) => {
        const { ex_id: exId } = req.params;
        logger.trace(`GET /ex/:ex_id endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not retrieve execution context ${exId}`);

        executionService.getExecutionContext(exId)
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    });

    v1routes.post('/ex/:ex_id/_stop', (req, res) => {
        const { params: { ex_id: exId }, query: { timeout, blocking = true } } = req;
        logger.trace(`POST /ex/:ex_id/_stop endpoint has been called, ex_id: ${exId}, removing any pending workers for the job`);
        const handleApiError = handleError(res, logger, 500, `Could not stop execution: ${exId}`);

        return executionService.stopExecution(exId, timeout)
            .then(() => _waitForStop(exId, blocking))
            .then(status => res.status(200).json({ status }))
            .catch(handleApiError);
    });

    v1routes.post('/ex/:ex_id/_pause', (req, res) => {
        const { ex_id: exId } = req.params;
        logger.trace(`POST /ex_id/:id/_pause endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not pause execution: ${exId}`);
        // for lifecyle events, we need to ensure that the execution is alive first
        executionService.getActiveExecution(exId)
            .then(() => executionService.pauseExecution(exId))
            .then(() => res.status(200).json({ status: 'paused' }))
            .catch(handleApiError);
    });

    v1routes.post('/ex/:ex_id/_recover', (req, res) => {
        const { params: { ex_id: exId }, query: { cleanup } } = req;
        const handleApiError = handleError(res, logger, 500, `Could not recover execution: ${exId}`);
        logger.trace(`POST /ex_id/:id/_recover endpoint has been called, ex_id: ${exId}`);

        if (cleanup && !(cleanup === 'all' || cleanup === 'errors')) {
            res.status(400).json({ error: 'if cleanup is specified it must be set to "all" or "errors"' });
            return;
        }

        executionService.recoverExecution(exId, cleanup)
            .then(response => res.status(200).json(response))
            .catch(handleApiError);
    });

    v1routes.post('/ex/:ex_id/_resume', (req, res) => {
        const { ex_id: exId } = req.params;
        logger.trace(`POST /ex/:id/_resume endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not resume execution: ${exId}`);
        // for lifecyle events, we need to ensure that the execution is alive first
        executionService.getActiveExecution(exId)
            .then(() => executionService.resumeExecution(exId))
            .then(() => res.status(200).json({ status: 'resumed' }))
            .catch(handleApiError);
    });

    v1routes.post('/ex/:ex_id/_workers', (req, res) => {
        const { params: { ex_id: exId }, query } = req;
        logger.trace(`POST /ex/:id/_workers endpoint has been called, ex_id: ${exId} query: ${JSON.stringify(query)}`);
        const handleApiError = handleError(res, logger, 500, `Could not change workers for execution: ${exId}`);

        _changeWorkers('execution', exId, query)
            .then(responseObj => res.status(200).send(`${responseObj.workerNum} workers have been ${responseObj.action} for execution: ${responseObj.ex_id}`))
            .catch(handleApiError);
    });

    v1routes.get('/ex/:ex_id/slicer', _deprecateSlicerName((req, res) => {
        const { ex_id: exId } = req.params;
        logger.trace(`GET /ex/:ex_id/slicer endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not get statistics for execution: ${exId}`);

        _controllerStats(exId)
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    }));

    v1routes.get('/ex/:ex_id/controller', (req, res) => {
        const { ex_id: exId } = req.params;
        logger.trace(`GET /ex/:ex_id/controller endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not get statistics for execution: ${exId}`);

        _controllerStats(exId)
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    });

    v1routes.get('/cluster/stats', (req, res) => {
        logger.trace('GET /cluster/stats endpoint has been called');
        const acceptHeader = _.get(req, 'headers.accept', '');
        const stats = executionService.getClusterStats();

        if ((acceptHeader !== '') && (acceptHeader.indexOf('application/openmetrics-text;') > -1)) {
            res.status(200).send(makePrometheus(stats));
        } else {
            // for backwards compatability (unsupported for prometheus)
            stats.slicer = stats.controllers;
            res.status(200).json(stats);
        }
    });

    v1routes.get('/cluster/slicers', _deprecateSlicerName((req, res) => {
        logger.trace('GET /cluster/slicers endpoint has been called');
        const handleApiError = handleError(res, logger, 500, 'Could not get execution statistics');

        _controllerStats()
            .then(results => res.status(200).send(results))
            .catch(handleApiError);
    }));

    v1routes.get('/cluster/controllers', (req, res) => {
        logger.trace('GET /cluster/controllers endpoint has been called');
        const handleApiError = handleError(res, logger, 500, 'Could not get execution statistics');

        _controllerStats()
            .then(results => res.status(200).send(results))
            .catch(handleApiError);
    });

    // backwards compatibility for /v1 routes
    app.use(v1routes);
    app.use('/v1', v1routes);

    app.route('/txt/assets*')
        .get(_redirect);

    app.get('/txt/workers', (req, res) => {
        logger.trace('GET /txt/workers endpoint has been called');

        const defaults = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
        const workers = executionService.findAllWorkers();
        const tableStr = makeTable(req, defaults, workers);
        res.status(200).send(tableStr);
    });

    app.get('/txt/nodes', (req, res) => {
        logger.trace('GET /txt/nodes endpoint has been called');

        const defaults = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];
        const nodes = executionService.getClusterState();

        const transform = _.map(nodes, (node) => {
            node.active = node.active.length;
            return node;
        });

        const tableStr = makeTable(req, defaults, transform);
        res.status(200).send(tableStr);
    });

    app.get('/txt/jobs', (req, res) => {
        logger.trace('GET /txt/jobs endpoint has been called');
        const defaults = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];
        let size = 10000;
        const handleApiError = handleError(res, logger, 500, 'Could not get all jobs');

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            ({ size } = req.query);
        }

        jobsService.getJobs(null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch(handleApiError);
    });

    app.get('/txt/ex', (req, res) => {
        logger.trace('GET /txt/ex endpoint has been called');
        const defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        const query = 'ex_id:*';
        let size = 10000;
        const handleApiError = handleError(res, logger, 500, 'Could not get all executions');

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            ({ size } = req.query);
        }
        executionService.searchExecutionContexts(query, null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch(handleApiError);
    });

    app.get('/txt/slicers', _deprecateSlicerName((req, res) => {
        logger.trace('GET /txt/slicers endpoint has been called');

        const defaults = [
            'name',
            'job_id',
            'workers_available',
            'workers_active',
            'failed',
            'queued',
            'processed'
        ];

        const handleApiError = handleError(res, logger, 500, 'Could not get all execution statistics');

        _controllerStats()
            .then((results) => {
                const tableStr = makeTable(req, defaults, results);
                res.status(200).send(tableStr);
            })
            .catch(handleApiError);
    }));

    app.get('/txt/controllers', (req, res) => {
        logger.trace('GET /txt/controllers endpoint has been called');

        const defaults = [
            'name',
            'job_id',
            'workers_available',
            'workers_active',
            'failed',
            'queued',
            'processed'
        ];

        const handleApiError = handleError(res, logger, 500, 'Could not get all execution statistics');

        _controllerStats()
            .then((results) => {
                const tableStr = makeTable(req, defaults, results);
                res.status(200).send(tableStr);
            })
            .catch(handleApiError);
    });

    // This is a catch all, any none supported api endpoints will return an error
    app.route('*')
        .all((req, res) => {
            sendError(res, 405, `cannot ${req.method} endpoint ${req.originalUrl}`);
        });

    function _changeWorkers(type, id, query) {
        const serviceContext = type === 'job' ? jobsService : executionService;
        let msg;
        let workerNum;
        const keyOptions = { add: true, remove: true, total: true };
        const queryKeys = Object.keys(query);

        if (!query) {
            return Promise.reject({
                code: 400,
                message: 'Must provide a query parameter in request'
            });
        }
        queryKeys.forEach((key) => {
            if (keyOptions[key]) {
                msg = key;
                workerNum = Number(query[key]);
            }
        });

        if (!msg || isNaN(workerNum) || workerNum <= 0) {
            return Promise.reject({
                code: 400,
                message: 'Must provide a valid worker parameter(add/remove/total) that is a number and greater than zero'
            });
        }

        if (msg === 'add') {
            return serviceContext.addWorkers(id, workerNum);
        }

        if (msg === 'remove') {
            return serviceContext.removeWorkers(id, workerNum);
        }

        return serviceContext.setWorkers(id, workerNum);
    }

    function _deprecateSlicerName(fn) {
        const msg = 'api endpoints with /slicers are being deprecated in favor of the semantically correct term of /controllers';
        return util.deprecate(fn, msg);
    }

    function _redirect(req, res) {
        req.pipe(request({
            method: req.method,
            url: `${assetsUrl}${req.url}`
        }).on('response', (assetsResponse) => {
            assetsResponse.pipe(res);
        })).on('error', (assetsResponse) => {
            res.status(500).send({ error: `Asset Service error while processing request, error: ${assetsResponse}` });
        });
    }

    function _controllerStats(exId) {
        return executionService.getControllerStats(exId);
    }

    function shutdown() {
        logger.info('shutting down');
        return Promise.resolve(true);
    }

    const api = {
        shutdown
    };

    function _initialize() {
        return Promise.resolve(api);
    }

    function _waitForStop(exId, blocking) {
        return new Promise((resolve) => {
            function checkExecution() {
                executionService.getExecutionContext(exId)
                    .then((execution) => {
                        const terminalList = executionService.terminalStatusList();
                        const isTerminal = terminalList.find(tStat => tStat === execution._status);
                        if (isTerminal || !(blocking === true || blocking === 'true')) resolve(execution._status);
                        else setTimeout(checkExecution, 3000);
                    })
                    .catch((err) => {
                        logger.error(err);
                        setTimeout(checkExecution, 3000);
                    });
            }

            checkExecution();
        });
    }

    return require('../storage/state')(context)
        .then((state) => {
            logger.info('api service is initializing...');
            stateStore = state;
            return _initialize(); // Load the initial pendingJobs state.
        });
};
