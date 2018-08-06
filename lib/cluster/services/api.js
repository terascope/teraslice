'use strict';

const _ = require('lodash');
const { Router } = require('express');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const request = require('request');
const { WError } = require('verror');
const { makeTable, respondWithError } = require('../../utils/api_utils');

module.exports = function module(context, app) {
    const logger = context.apis.foundation.makeLogger({ module: 'api_service' });
    const executionService = context.services.execution;
    const jobsService = context.services.jobs;
    const { messaging } = context;
    const assetsUrl = `http://127.0.0.1:${process.env.assets_port}`;
    const v1routes = new Router();
    let stateStore;

    app.use(bodyParser.json({
        type(req) {
            return (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded');
        }
    }));

    app.use((err, req, res, next) => {
        if (err instanceof SyntaxError) {
            const error = new WError(err, 'the json submitted is malformed');
            error.statusCode = 400;
            respondWithError(res, logger, error);
        } else {
            next();
        }
    });

    app.set('json spaces', 4);

    v1routes.get('/cluster/state', (req, res) => {
        res.status(200).json(executionService.getClusterState());
    });

    v1routes.route('/assets*')
        .delete((req, res) => {
            const { asset_id: assetId } = req.params;
            messaging.broadcast('assets:delete', { payload: assetId });
            _redirect(req, res);
        })
        .post((req, res) => {
            if (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                const error = new WError('/asset endpoints do not accept json');
                error.statusCode = 415;
                respondWithError(res, logger, error);
                return;
            }
            _redirect(req, res);
        })
        .get(_redirect);

    v1routes.post('/jobs', (req, res) => {
        // if no job was posted an empty object is returned, so we check if it has values
        if (!req.body.operations) {
            const error = new WError('No job was posted');
            error.statusCode = 400;
            respondWithError(res, logger, error);
        } else {
            const jobSpec = req.body;
            let shouldRun = true;

            if (req.query.start && req.query.start === 'false') {
                shouldRun = false;
            }
            logger.debug(`POST /jobs endpoint has received shouldRun: ${shouldRun}, job:`, jobSpec);

            jobsService.submitJob(jobSpec, shouldRun)
                .then((ids) => {
                    res.status(202).json(ids);
                })
                .catch((err) => {
                    const error = new WError(err, 'Job submission failed');
                    respondWithError(res, logger, error);
                });
        }
    });

    v1routes.get('/jobs', (req, res) => {
        const { from, size, sort } = req.query;

        logger.debug(`GET /jobs endpoint has been called, from: ${from}, size: ${size}, sort: ${sort}`);

        jobsService.getJobs(from, size, sort)
            .then((results) => {
                res.status(200).json(results);
            })
            .catch((err) => {
                const error = new WError(err, 'Could not retrieve list of jobs');
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/jobs/:job_id', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);

        jobsService.getJob(jobId)
            .then(jobSpec => res.status(200).json(jobSpec))
            .catch((err) => {
                const error = new WError(err, 'Could not retrieve job');
                respondWithError(res, logger, error);
            });
    });

    v1routes.put('/jobs/:job_id', (req, res) => {
        const { job_id: jobId } = req.params;
        const jobSpec = req.body;
        if (Object.keys(jobSpec).length === 0) {
            const error = new WError('no data was provided to update job %s', jobId);
            error.statusCode = 400;
            respondWithError(res, logger, error);
            return;
        }
        logger.debug(`PUT /jobs/:job_id endpoint has been called, job_id: ${jobId}, update changes: `, jobSpec);

        jobsService.updateJob(jobId, jobSpec)
            .then(status => res.status(200).json(status))
            .catch((err) => {
                const error = new WError(err, 'Could not update job');
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/jobs/:job_id/ex', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => executionService.getExecutionContext(exId))
            .then(execution => res.status(200).json(execution))
            .catch((err) => {
                const error = new WError(err, 'Could not retrieve list of execution contexts');
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/jobs/:job_id/_start', (req, res) => {
        const { job_id: jobId } = req.params;
        if (!jobId) {
            const error = new WError('no job_id was posted');
            error.statusCode = 400;
            respondWithError(res, logger, error);
            return;
        }
        logger.debug(`GET /jobs/:job_id/_start endpoint has been called, job_id: ${jobId}`);

        jobsService.startJob(jobId)
            .then(ids => res.status(200).json(ids))
            .catch((err) => {
                const error = new WError(err, 'Could not start job: %s', jobId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/jobs/:job_id/_stop', (req, res) => {
        const { query: { timeout }, params: { job_id: jobId } } = req;
        logger.debug(`POST /jobs/:job_id/_stop endpoint has been called, job_id: ${jobId}, removing any pending workers for the job`);

        jobsService.stopJob(jobId, timeout)
            .then(status => res.status(200).json({ status }))
            .catch((err) => {
                const error = new WError(err, 'Could not stop execution for job: %s', jobId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/jobs/:job_id/_pause', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.debug(`POST /jobs/:job_id/_pause endpoint has been called, job_id: ${jobId}`);

        jobsService.pauseJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch((err) => {
                const error = new WError(err, 'Could not pause execution for job: %s', jobId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/jobs/:job_id/_resume', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.debug(`POST /jobs/:job_id/_resume endpoint has been called, job_id: ${jobId}`);

        jobsService.resumeJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch((err) => {
                const error = new WError(err, 'Could not resume execution for job: %s', jobId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/jobs/:job_id/_recover', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.debug(`POST /jobs/:job_id/_recover endpoint has been called, job_id: ${jobId}`);

        jobsService.recoverJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch((err) => {
                const error = new WError(err, 'Could not recover execution for job: %s', jobId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/jobs/:job_id/_workers', (req, res) => {
        const { query, params: { job_id: jobId } } = req;
        logger.debug('POST /jobs/:job_id/_workers endpoint has been called, query:', query);

        _changeWorkers('job', jobId, query)
            .then(responseObj => res.status(200).send(`${responseObj.workerNum} workers have been ${responseObj.action} for execution: ${responseObj.ex_id}`))
            .catch((err) => {
                const error = new WError(err, 'Could not change workers for job: %s', jobId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/jobs/:job_id/slicer', (req, res) => {
        const { job_id: jobId } = req.params;
        logger.debug(`GET /jobs/:job_id/slicer endpoint has been called, job_id: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => _slicerStats(exId))
            .then(results => res.status(200).json(results))
            .catch((err) => {
                const error = new WError(err, 'Could not get slicer statistics for job: %s', jobId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/jobs/:job_id/errors/', (req, res) => {
        const { query: { size = 10000, from }, params: { job_id: jobId } } = req;

        logger.debug(`GET /jobs/:job_id/errors endpoint has been called, job_id: ${jobId}, from: ${from}, size: ${size}`);

        jobsService.getLatestExecutionId(jobId)
            .then((exId) => {
                if (!exId) {
                    const error = new Error(`no executions were found for job: ${jobId}`);
                    error.code = 404;
                    return Promise.reject(error);
                }
                const query = `state:error AND ex_id:${exId}`;
                return stateStore.search(query, from, size, '_updated:asc');
            })
            .then(errorStates => res.status(200).json(errorStates))
            .catch((err) => {
                const error = new WError(err, 'Could not get errors for job: %s', jobId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/jobs/:job_id/errors/:ex_id', (req, res) => {
        const { params: { job_id: jobId, ex_id: exId }, query: { from, size = 10000 } } = req;

        logger.debug(`GET /jobs/:job_id/errors endpoint has been called, job_id: ${jobId}, ex_id: ${exId}, from: ${from}, size: ${size}`);

        const query = `ex_id:${exId} AND state:error`;

        stateStore.search(query, from, size, '_updated:asc')
            .then((errorStates) => {
                res.status(200).json(errorStates);
            })
            .catch((err) => {
                const error = new WError(err, 'Could not get errors for job: %s, execution: %s', jobId, exId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/ex', (req, res) => {
        const { status, from, size, sort } = req.query;  //eslint-disable-line

        logger.debug(`GET /ex endpoint has been called, status: ${status}, from: ${from}, size: ${size}, sort: ${sort}`);
        let query = 'ex_id:*';
        if (status) query += ` AND _status:${status}`;

        executionService.searchExecutionContexts(query, from, size, sort)
            .then(results => res.status(200).json(results))
            .catch((err) => {
                const error = new WError(err, 'Could not retrieve list of execution contexts');
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/ex/:ex_id', (req, res) => {
        const { ex_id: exId } = req.params;
        logger.debug(`GET /ex/:ex_id endpoint has been called, ex_id: ${exId}`);

        executionService.getExecutionContext(exId)
            .then(results => res.status(200).json(results))
            .catch((err) => {
                const error = new WError(err, 'Could not retrieve execution context %s', exId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/ex/:ex_id/_stop', (req, res) => {
        const { params: { ex_id: exId }, query: { timeout } } = req;
        logger.debug(`POST /ex/:ex_id/_stop endpoint has been called, ex_id: ${exId}, removing any pending workers for the job`);

        // for lifecyle events, we need to ensure that the execution is alive first
        executionService.getActiveExecution(exId)
            .then(() => executionService.stopExecution(exId, timeout))
            .then(() => res.status(200).json({ status: 'stopped' }))
            .catch((err) => {
                const error = new WError(err, 'Could not stop execution %s', exId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/ex/:ex_id/_pause', (req, res) => {
        const { ex_id: exId } = req.params;
        logger.debug(`POST /ex_id/:id/_pause endpoint has been called, ex_id: ${exId}`);

        // for lifecyle events, we need to ensure that the execution is alive first
        executionService.getActiveExecution(exId)
            .then(() => executionService.pauseExecution(exId))
            .then(() => res.status(200).json({ status: 'paused' }))
            .catch((err) => {
                const error = new WError(err, 'Could not pause execution %s', exId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/ex/:ex_id/_recover', (req, res) => {
        const { ex_id: exId } = req.params;
        const { cleanup } = req.query;
        logger.debug(`POST /ex_id/:id/_recover endpoint has been called, ex_id: ${exId}`);

        if (cleanup && !(cleanup === 'all' || cleanup === 'errors')) {
            const error = new WError('if cleanup is specified it must be set to "all" or "errors"');
            error.statusCode = 400;
            respondWithError(res, logger, error);
            return;
        }

        executionService.recoverExecution(exId, cleanup)
            .then(response => res.status(200).json(response))
            .catch((err) => {
                const error = new WError(err, 'Could not recover execution %s', exId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/ex/:ex_id/_resume', (req, res) => {
        const { ex_id: exId } = req.params;
        logger.debug(`POST /ex/:id/_resume endpoint has been called, ex_id: ${exId}`);

        // for lifecyle events, we need to ensure that the execution is alive first
        executionService.getActiveExecution(exId)
            .then(() => executionService.resumeExecution(exId))
            .then(() => res.status(200).json({ status: 'resumed' }))
            .catch((err) => {
                const error = new WError(err, 'Could not resume execution: %s', exId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.post('/ex/:ex_id/_workers', (req, res) => {
        const { params: { ex_id: exId }, query } = req;
        logger.debug(`POST /ex/:id/_workers endpoint has been called, ex_id: ${exId} query: ${JSON.stringify(query)}`);

        _changeWorkers('execution', exId, query)
            .then(responseObj => res.status(200).send(`${responseObj.workerNum} workers have been ${responseObj.action} for execution: ${responseObj.ex_id}`))
            .catch((err) => {
                const error = new WError(err, 'Could not change workers for execution %s', exId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/ex/:ex_id/slicer', (req, res) => {
        const { ex_id: exId } = req.params;
        logger.debug(`GET /ex/:ex_id/slicer endpoint has been called, ex_id: ${exId}`);

        _slicerStats(exId)
            .then(results => res.status(200).json(results))
            .catch((err) => {
                const error = new WError(err, 'Could not get statistics for execution %s', exId);
                respondWithError(res, logger, error);
            });
    });

    v1routes.get('/cluster/stats', (req, res) => {
        logger.debug('GET /cluster/stats endpoint has been called');
        res.status(200).json(executionService.getClusterStats());
    });

    v1routes.get('/cluster/slicers', (req, res) => {
        logger.debug('GET /cluster/slicers endpoint has been called');

        _slicerStats()
            .then(results => res.status(200).send(results))
            .catch((err) => {
                const error = new WError(err, 'Could not get execution statistics');
                respondWithError(res, logger, error);
            });
    });

    // backwards compatibility for /v1 routes
    app.use(v1routes);
    app.use('/v1', v1routes);

    app.route('/txt/assets*')
        .get(_redirect);

    app.get('/txt/workers', (req, res) => {
        logger.debug('GET /txt/workers endpoint has been called');

        const defaults = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
        const workers = executionService.findAllWorkers();
        const tableStr = makeTable(req, defaults, workers);
        res.status(200).send(tableStr);
    });

    app.get('/txt/nodes', (req, res) => {
        logger.debug('GET /txt/nodes endpoint has been called');

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
        logger.debug('GET /txt/jobs endpoint has been called');
        const defaults = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];
        let size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            ({ size } = req.query);
        }

        jobsService.getJobs(null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch((err) => {
                const error = new WError(err, 'Could not get all jobs');
                respondWithError(res, logger, error);
            });
    });

    app.get('/txt/ex', (req, res) => {
        logger.debug('GET /txt/ex endpoint has been called');
        const defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        const query = 'ex_id:*';
        let size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            ({ size } = req.query);
        }
        executionService.searchExecutionContexts(query, null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch((err) => {
                const error = new WError(err, 'Could not get all executions');
                respondWithError(res, logger, error);
            });
    });

    app.get('/txt/slicers', (req, res) => {
        logger.debug('GET /txt/slicers endpoint has been called');

        const defaults = [
            'name',
            'job_id',
            'workers_available',
            'workers_active',
            'failed',
            'queued',
            'processed'
        ];

        _slicerStats()
            .then((results) => {
                const tableStr = makeTable(req, defaults, results);
                res.status(200).send(tableStr);
            })
            .catch((err) => {
                const error = new WError(err, 'Could not get all execution statistics');
                respondWithError(res, logger, error);
            });
    });

    // This is a catch all, any none supported api endpoints will return an error
    app.route('*')
        .all((req, res) => {
            const error = new WError('cannot %s endpoint %s', req.method, req.originalUrl);
            error.statusCode = 405;
            respondWithError(res, logger, error);
        });

    function _changeWorkers(type, id, query) {
        const serviceContext = type === 'job' ? jobsService : executionService;
        let msg;
        let workerNum;
        const keyOptions = { add: true, remove: true, total: true };
        const queryKeys = Object.keys(query);

        if (!query) {
            const error = new WError('Must provide a query parameter in request');
            error.statusCode = 400;
            return Promise.reject(error);
        }

        queryKeys.forEach((key) => {
            if (keyOptions[key]) {
                msg = key;
                workerNum = Number(query[key]);
            }
        });

        if (!msg || isNaN(workerNum) || workerNum <= 0) {
            const error = new WError('Must provide a valid worker parameter(add/remove/total) that is a number and greater than zero');
            error.statusCode = 400;
            return Promise.reject(error);
        }

        if (msg === 'add') {
            return serviceContext.addWorkers(id, workerNum);
        }

        if (msg === 'remove') {
            return serviceContext.removeWorkers(id, workerNum);
        }

        return serviceContext.setWorkers(id, workerNum);
    }

    function _redirect(req, res) {
        req.pipe(request({
            method: req.method,
            url: `${assetsUrl}${req.url}`
        }).on('response', (assetsResponse) => {
            assetsResponse.pipe(res);
        })).on('error', (assetsResponse) => {
            const error = new WError(assetsResponse, 'Asset Service error while processing request');
            respondWithError(res, logger, error);
        });
    }

    function _slicerStats(exId) {
        return executionService.getSlicerStats(exId);
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

    return require('../storage/state')(context)
        .then((state) => {
            logger.info('Initializing');
            stateStore = state;
            return _initialize(); // Load the initial pendingJobs state.
        });
};
