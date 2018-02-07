'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const parseError = require('error_parser');
const request = require('request');
const makeTable = require('../../utils/api_utils').makeTable;
const sendError = require('../../utils/api_utils').sendError;

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
            jobsService.submitJob(jobSpec, shouldRun)
                .then((ids) => {
                    res.status(202).json(ids);
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    sendError(res, 500, `Job submission failed: ${errMsg}`);
                });
        }
    });

    app.get('/jobs', (req, res) => {
        logger.debug(`GET /jobs endpoint has been called, from: ${req.query.from}, size: ${req.query.size}, sort: ${req.query.sort}`);
        jobsService.getJobs(req.query.from, req.query.size, req.query.sort)
            .then((results) => {
                res.status(200).json(results);
            })
            .catch((err) => {
                const errMsg = `Error: could not retrieve list of jobs, ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/jobs/:job_id', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);

        jobsService.getJob(jobId)
            .then(jobSpec => res.status(200).json(jobSpec))
            .catch((err) => {
                const errMsg = `Error: could not retrieve job: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.put('/jobs/:job_id', (req, res) => {
        const jobId = req.params.job_id;
        const jobSpec = req.body;

        if (Object.keys(jobSpec).length === 0) {
            sendError(res, 400, `no data was provided to update job ${jobId}`);
            return;
        }
        logger.debug(`PUT /jobs/:job_id endpoint has been called, job_id: ${jobId}, update changes: `, jobSpec);

        jobsService.updateJob(jobId, jobSpec)
            .then(status => res.status(200).json(status))
            .catch((err) => {
                sendError(res, 500, `Could not update job, error: ${parseError(err)}`);
            });
    });

    app.get('/jobs/:job_id/ex', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => executionService.getExecutionContext(exId))
            .then(execution => res.status(200).json(execution))
            .catch((err) => {
                const errMsg = `Error: could not retrieve list of execution contexts. ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/jobs/:job_id/_start', (req, res) => {
        const jobId = req.params.job_id;
        if (!jobId) {
            sendError(res, 400, 'no job_id was posted');
            return;
        }
        logger.debug(`GET /jobs/:job_id/_start endpoint has been called, job_id: ${jobId}`);
        jobsService.startJob(jobId)
            .then(ids => res.status(200).json(ids))
            .catch((err) => {
                sendError(res, 500, `Could not start job: ${jobId}, error: ${parseError(err)}`);
            });
    });

    app.post('/jobs/:job_id/_stop', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_stop endpoint has been called, job_id: ${jobId}, removing any pending workers for the job`);

        jobsService.stopJob(jobId, req.query.timeout)
            .then(status => res.status(200).json({ status }))
            .catch((err) => {
                const errMsg = `could not stop execution, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/jobs/:job_id/_pause', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_pause endpoint has been called, job_id: ${jobId}`);

        jobsService.pauseJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch((err) => {
                const errMsg = `could not pause execution, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/jobs/:job_id/_resume', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_resume endpoint has been called, job_id: ${jobId}`);

        jobsService.resumeJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch((err) => {
                const errMsg = `could not resume execution, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/jobs/:job_id/_recover', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_recover endpoint has been called, job_id: ${jobId}`);

        jobsService.recoverJob(jobId)
            .then(status => res.status(200).json({ status }))
            .catch((err) => {
                const errMsg = `could not recover job, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/jobs/:job_id/_workers', (req, res) => {
        logger.debug('POST /jobs/:job_id/_workers endpoint has been called, query:', req.query);
        _changeWorkers('job', req.params.job_id, req.query)
            .then(responseObj => res.status(200).send(`${responseObj.workerNum} workers have been ${responseObj.action} for execution: ${responseObj.ex_id}`))
            .catch((errObj) => {
                if (errObj.code) {
                    logger.error(errObj.error);
                    sendError(res, errObj.code, errObj.message);
                    return;
                }

                const errMsg = parseError(errObj);
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/jobs/:job_id/slicer', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`GET /jobs/:job_id/slicer endpoint has been called, job_id: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => _slicerStats(exId))
            .then(results => res.status(200).json(results))
            .catch((err) => {
                const errMsg = `could not get slicer statistics, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, err.code, errMsg);
            });
    });

    app.get('/jobs/:job_id/errors/', (req, res) => {
        const jobId = req.params.job_id;
        const from = req.query.from;
        const size = req.query.size ? req.query.size : 10000;

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
            .catch((err) => {
                const errMsg = `could not get errors from job: ${jobId}, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/jobs/:job_id/errors/:ex_id', (req, res) => {
        const jobId = req.params.job_id;
        const exId = req.params.ex_id;
        const from = req.query.from;
        const size = req.query.size ? req.query.size : 10000;

        logger.debug(`GET /jobs/:job_id/errors endpoint has been called, job_id: ${jobId}, ex_id: ${exId}, from: ${from}, size: ${size}`);

        const query = `ex_id:${exId} AND state:error`;

        stateStore.search(query, from, size, '_updated:asc')
            .then((errorStates) => {
                res.status(200).json(errorStates);
            })
            .catch((err) => {
                const errMsg = `could not get errors from job: ${jobId}, ex_id: ${exId}, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/ex', (req, res) => {
        const status = req.query.status;
        const from = req.query.from;
        const size = req.query.size;
        const sort = req.query.sort;
        logger.debug(`GET /ex endpoint has been called, status: ${status}, from: ${from}, size: ${size}, sort: ${sort}`);
        let query = 'ex_id:*';
        if (status) query += ` AND _status:${status}`;

        executionService.searchExecutionContexts(query, from, size, sort)
            .then(results => res.status(200).json(results))
            .catch((err) => {
                const errMsg = `Error: could not retrieve list of execution contexts. ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            });
    });

    app.get('/ex/:ex_id', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`GET /ex/:ex_id endpoint has been called, ex_id: ${exId}`);

        executionService.getExecutionContext(exId)
            .then(results => res.status(200).json(results))
            .catch((err) => {
                const errMsg = `Error: could not retrieve list of execution contexts. ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/ex/:ex_id/_stop', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex/:ex_id/_stop endpoint has been called, ex_id: ${exId}, removing any pending workers for the job`);
        executionService.stopExecution(exId, req.query.timeout)
            .then(() => res.status(200).json({ status: 'stopped' }))
            .catch((err) => {
                const errMsg = `could not stop execution, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/ex/:ex_id/_pause', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex_id/:id/_pause endpoint has been called, ex_id: ${exId}`);
        executionService.pauseExecution(exId)
            .then(() => res.status(200).json({ status: 'paused' }))
            .catch((err) => {
                const errMsg = `could not stop execution, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/ex/:ex_id/_resume', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex/:id/_resume endpoint has been called, ex_id: ${exId}`);
        executionService.resumeExecution(exId)
            .then(() => res.status(200).json({ status: 'resumed' }))
            .catch((err) => {
                const errMsg = `could not stop execution, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.post('/ex/:ex_id/_workers', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex/:id/_workers endpoint has been called, ex_id: ${req.params.ex_id} query: ${JSON.stringify(req.query)}`);

        _changeWorkers('execution', exId, req.query)
            .then(responseObj => res.status(200).send(`${responseObj.workerNum} workers have been ${responseObj.action} for execution: ${responseObj.ex_id}`))
            .catch((errObj) => {
                if (errObj.code) {
                    logger.error(errObj.error);
                    sendError(res, errObj.code, errObj.message);
                    return;
                }
                const errMsg = parseError(errObj);
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/ex/:ex_id/slicer', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`GET /ex/:ex_id/slicer endpoint has been called, ex_id: ${exId}`);

        _slicerStats(exId)
            .then(results => res.status(200).json(results))
            .catch((err) => {
                const errMsg = `could not get slicer statistics, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/cluster/stats', (req, res) => {
        logger.debug('GET /cluster/stats endpoint has been called');
        res.status(200).json(executionService.getClusterStats());
    });

    app.get('/cluster/slicers', (req, res) => {
        logger.debug('GET /cluster/slicers endpoint has been called');
        _slicerStats()
            .then(results => res.status(200).send(results))
            .catch(err => sendError(res, 500, err.message));
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

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }

        jobsService.getJobs(null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch((err) => {
                const errMsg = `Error getting all jobs, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/txt/ex', (req, res) => {
        logger.debug('GET /txt/ex endpoint has been called');
        const defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        const query = 'ex_id:*';
        let size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }
        executionService.searchExecutionContexts(query, null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch((err) => {
                const errMsg = `Error getting all execution contexts, error: ${parseError(err)}`;
                logger.error(errMsg);
                sendError(res, 500, errMsg);
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
                sendError(res, err.code, err.message);
            });
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

    return require('../storage/state')(context)
        .then((state) => {
            logger.info('Initializing');
            stateStore = state;
            return _initialize(); // Load the initial pendingJobs state.
        });
};
