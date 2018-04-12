'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const request = require('request');
const makeTable = require('../../../utils/api_utils').makeTable;
const sendError = require('../../../utils/api_utils').sendError;
const handleError = require('../../../utils/api_utils').handleError;

module.exports = function module(context, app) {
    const logger = context.apis.foundation.makeLogger({ module: 'api_service' });
    const executionService = context.services.execution;
    const jobsService = context.services.jobs;
    const assetsUrl = `http://${context.sysconfig.teraslice.master_hostname}:${process.env.assets_port}`;
    const messaging = context.messaging;
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

    app.get('/cluster/state', (req, res) => {
        res.status(200).json(executionService.getClusterState());
    });

    app.route('/assets*')
        .delete((req, res) => {
            const assetId = req.params.asset_id;
            messaging.broadcast('assets:delete', { payload: assetId });
            _redirect(req, res);
        })
        .post((req, res) => {
            if (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                sendError(res, 400, '/asset endpoints do not accept json');
                return;
            }
            _redirect(req, res);
        });

    app.route('/txt/assets*')
        .get(_redirect);


    app.post('/jobs', (req, res) => {
        // if no job was posted an empty object is returned, so we check if it has values
        if (!req.body.operations) {
            sendError(res, 400, 'No job was posted');
        } else {
            const jobSpec = req.body;
            let shouldRun = true;

            if (req.query.start && req.query.start === 'false') {
                shouldRun = false;
            }
            logger.debug(`POST /jobs endpoint has received shouldRun: ${shouldRun}, job:`, jobSpec);
            const handleApiError = handleError(res, logger, 500, 'Job submission failed');

            jobsService.submitJob(jobSpec, shouldRun)
                .then((ids) => {
                    res.status(202).json(ids);
                })
                .catch(handleApiError);
        }
    });

    app.get('/jobs', (req, res) => {
        logger.debug(`GET /jobs endpoint has been called, from: ${req.query.from}, size: ${req.query.size}, sort: ${req.query.sort}`);
        const handleApiError = handleError(res, logger, 500, 'Could not retrieve list of jobs');
        jobsService.searchJobs(logger, req, 'job_id:*')
            .then((results) => {
                res.status(200).json(results);
            })
            .catch(handleApiError);
    });

    app.get('/jobs/:job_id', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, 'Could not retrieve job');

        jobsService.getJob(jobId)
            .then(jobSpec => res.status(200).json(jobSpec))
            .catch(handleApiError);
    });

    app.put('/jobs/:job_id', (req, res) => {
        const jobId = req.params.job_id;
        const jobSpec = req.body;

        if (Object.keys(jobSpec).length === 0) {
            sendError(res, 400, `no data was provided to update job ${jobId}`);
            return;
        }
        logger.debug(`PUT /jobs/:job_id endpoint has been called, job_id: ${jobId}, update changes: `, jobSpec);
        const handleApiError = handleError(res, logger, 500, 'Could not update job');

        jobsService.updateJob(jobId, jobSpec)
            .then(status => res.status(200).json(status))
            .catch(handleApiError);
    });

    app.get('/jobs/:job_id/ex', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, 'Could not retrieve list of execution contexts');

        jobsService.getLatestExecutionId(jobId)
            .then(exId => executionService.getExecutionContext(exId))
            .then(execution => res.status(200).json(execution))
            .catch(handleApiError);
    });

    app.post('/jobs/:job_id/_start', (req, res) => {
        const jobId = req.params.job_id;
        if (!jobId) {
            sendError(res, 400, 'no job_id was posted');
            return;
        }
        logger.debug(`GET /jobs/:job_id/_start endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not start job: ${jobId}`);

        jobsService.startJob(jobId)
            .then(ids => res.status(200).json(ids))
            .catch(handleApiError);
    });

    app.post('/jobs/:job_id/_stop', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_stop endpoint has been called, job_id: ${jobId}, removing any pending workers for the job`);
        const handleApiError = handleError(res, logger, 500, `Could not stop execution for job: ${jobId}`);

        jobsService.stopJob(jobId, req.query.timeout)
            .then(status => res.status(200).json({ status }))
            .catch(handleApiError);
    });

    app.post('/jobs/:job_id/_pause', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_pause endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not pause execution for job: ${jobId}`);

        jobsService.pauseJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch(handleApiError);
    });

    app.post('/jobs/:job_id/_resume', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_resume endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not resume execution for job: ${jobId}`);

        jobsService.resumeJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch(handleApiError);
    });

    app.post('/jobs/:job_id/_recover', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_recover endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not recover execution for job: ${jobId}`);

        jobsService.recoverJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch(handleApiError);
    });

    app.post('/jobs/:job_id/_workers', (req, res) => {
        logger.debug('POST /jobs/:job_id/_workers endpoint has been called, query:', req.query);
        const jobId = req.params.job_id;
        const handleApiError = handleError(res, logger, 500, `Could not change workers for job: ${jobId}`);

        _changeWorkers('job', jobId, req.query)
            .then(responseObj => res.status(200).send(`${responseObj.workerNum} workers have been ${responseObj.action} for execution: ${responseObj.ex_id}`))
            .catch(handleApiError);
    });

    app.get('/jobs/:job_id/slicer', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`GET /jobs/:job_id/slicer endpoint has been called, job_id: ${jobId}`);
        const handleApiError = handleError(res, logger, 500, `Could not get slicer statistics for job: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => _slicerStats(exId))
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    });

    app.get('/jobs/:job_id/errors/', (req, res) => {
        const jobId = req.params.job_id;
        const from = req.query.from;
        const size = req.query.size ? req.query.size : 10000;
        const handleApiError = handleError(res, logger, 500, `Could not get errors for job: ${jobId}`);

        logger.debug(`GET /jobs/:job_id/errors endpoint has been called, job_id: ${jobId}, from: ${from}, size: ${size}`);

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

    app.get('/jobs/:job_id/errors/:ex_id', (req, res) => {
        const jobId = req.params.job_id;
        const exId = req.params.ex_id;
        const from = req.query.from;
        const size = req.query.size ? req.query.size : 10000;
        const handleApiError = handleError(res, logger, 500, `Could not get errors for job: ${jobId}, execution: ${exId}`);

        logger.debug(`GET /jobs/:job_id/errors endpoint has been called, job_id: ${jobId}, ex_id: ${exId}, from: ${from}, size: ${size}`);

        const query = `ex_id:${exId} AND state:error`;

        stateStore.search(query, from, size, '_updated:asc')
            .then((errorStates) => {
                res.status(200).json(errorStates);
            })
            .catch(handleApiError);
    });

    app.get('/ex', (req, res) => {
        const status = req.query.status;
        const from = req.query.from;
        const size = req.query.size;
        const sort = req.query.sort;
        const handleApiError = handleError(res, logger, 500, 'Could not retrieve list of execution contexts');

        logger.debug(`GET /ex endpoint has been called, status: ${status}, from: ${from}, size: ${size}, sort: ${sort}`);
        let query = 'ex_id:*';
        if (status) query += ` AND _status:${status}`;

        executionService.searchExecutionContexts(query, from, size, sort)
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    });

    app.get('/ex/:ex_id', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`GET /ex/:ex_id endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not retrieve execution context ${exId}`);

        executionService.getExecutionContext(exId)
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    });

    app.post('/ex/:ex_id/_stop', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex/:ex_id/_stop endpoint has been called, ex_id: ${exId}, removing any pending workers for the job`);
        const handleApiError = handleError(res, logger, 500, `Could not stop execution: ${exId}`);
        // for lifecyle events, we need to ensure that the execution is alive first
        executionService.getActiveExecution(exId)
            .then(() => executionService.stopExecution(exId, req.query.timeout))
            .then(() => res.status(200).json({ status: 'stopped' }))
            .catch(handleApiError);
    });

    app.post('/ex/:ex_id/_pause', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex_id/:id/_pause endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not pause execution: ${exId}`);
        // for lifecyle events, we need to ensure that the execution is alive first
        executionService.getActiveExecution(exId)
            .then(() => executionService.pauseExecution(exId))
            .then(() => res.status(200).json({ status: 'paused' }))
            .catch(handleApiError);
    });

    app.post('/ex/:ex_id/_resume', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex/:id/_resume endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not resume execution: ${exId}`);
        // for lifecyle events, we need to ensure that the execution is alive first
        executionService.getActiveExecution(exId)
            .then(() => executionService.resumeExecution(exId))
            .then(() => res.status(200).json({ status: 'resumed' }))
            .catch(handleApiError);
    });

    app.post('/ex/:ex_id/_workers', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex/:id/_workers endpoint has been called, ex_id: ${req.params.ex_id} query: ${JSON.stringify(req.query)}`);
        const handleApiError = handleError(res, logger, 500, `Could not change workers for execution: ${exId}`);

        _changeWorkers('execution', exId, req.query)
            .then(responseObj => res.status(200).send(`${responseObj.workerNum} workers have been ${responseObj.action} for execution: ${responseObj.ex_id}`))
            .catch(handleApiError);
    });

    app.get('/ex/:ex_id/slicer', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`GET /ex/:ex_id/slicer endpoint has been called, ex_id: ${exId}`);
        const handleApiError = handleError(res, logger, 500, `Could not get statistics for execution: ${exId}`);

        _slicerStats(exId)
            .then(results => res.status(200).json(results))
            .catch(handleApiError);
    });

    app.get('/cluster/stats', (req, res) => {
        logger.debug('GET /cluster/stats endpoint has been called');
        res.status(200).json(executionService.getClusterStats());
    });

    app.get('/cluster/slicers', (req, res) => {
        logger.debug('GET /cluster/slicers endpoint has been called');
        const handleApiError = handleError(res, logger, 500, 'Could not get execution statistics');

        _slicerStats()
            .then(results => res.status(200).send(results))
            .catch(handleApiError);
    });

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
        const handleApiError = handleError(res, logger, 500, 'Could not get all jobs');

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }
        //TODO fix me
        jobsService.searchJobs(null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch(handleApiError);
    });

    app.get('/txt/ex', (req, res) => {
        logger.debug('GET /txt/ex endpoint has been called');
        const defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        const query = 'ex_id:*';
        let size = 10000;
        const handleApiError = handleError(res, logger, 500, 'Could not get all executions');

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }
        executionService.searchExecutionContexts(query, null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch(handleApiError);
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

        const handleApiError = handleError(res, logger, 500, 'Could not get all execution statistics');

        _slicerStats()
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

    function _redirect(req, res) {
        req.pipe(request({
            method: req.method,
            url: `${assetsUrl}${req.url}`
        }).on('response', (assetsResponse) => {
            assetsResponse.pipe(res);
        }));
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

    return require('../../storage/state')(context)
        .then((state) => {
            logger.info('Initializing');
            stateStore = state;
            return _initialize(); // Load the initial pendingJobs state.
        });
};
