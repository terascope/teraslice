'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const parseError = require('../../utils/error_utils').parseError;
const request = require('request');
const makeTable = require('../../utils/api_utils').makeTable;
const sendError = require('../../utils/api_utils').sendError;

module.exports = function module(context, app) {
    const logger = context.foundation.makeLogger({ module: 'api_service' });
    const clusterService = context.services.cluster;
    const jobsService = context.services.jobs;
    const assetsUrl = `http://${context.sysconfig.teraslice.master_hostname}:${process.env.assets_port}`;

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
        res.status(200).json(clusterService.getClusterState());
    });

    app.route('/assets*')
        .delete(_redirect)
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
                    logger.error(`Could not submit job, error: ${errMsg}`);
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
                logger.error(`Error: could not retrieve list of jobs, ${parseError(err)}`);
                sendError(res, 500, 'Error: could not retrieve list of jobs.');
            });
    });

    app.get('/jobs/:job_id', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);

        jobsService.getJob(jobId)
            .then(jobSpec => res.status(200).json(jobSpec))
            .catch((err) => {
                logger.error(`Error: could not retrieve job: ${parseError(err)}`);
                sendError(res, 500, 'Could not retrieve job');
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
                logger.error(`Error: could not update job: ${parseError(err)}`);
                sendError(res, 500, 'Could not update job');
            });
    });

    app.get('/jobs/:job_id/ex', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${jobId}`);

        jobsService.getLatestExecutionId(jobId)
            .then(exId => jobsService.getExecutionContext(exId))
            .then(execution => res.status(200).json(execution))
            .catch((err) => {
                logger.error(`Error: could not retrieve list of execution contexts. ${parseError(err)}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
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
                logger.error(`Error: could not start execution: ${parseError(err)}`);
                sendError(res, 500, `Could not start execution: ${jobId}`);
            });
    });

    app.post('/jobs/:job_id/_stop', (req, res) => {
        const jobId = req.params.job_id;
        logger.debug(`POST /jobs/:job_id/_stop endpoint has been called, job_id: ${jobId}, removing any pending workers for the job`);

        jobsService.stopJob(jobId)
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
        _changeWorkers(req.params.job_id, req.query)
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
                const errMsg = parseError(err);
                logger.error(`could not get slicer statistics, error: ${errMsg}`);
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
                return jobsService.getJobStateRecords(query, from, size, '_updated:asc');
            })
            .then(errorStates => res.status(200).json(errorStates))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`could not get errors from job: ${jobId}, error: ${errMsg}`);
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

        jobsService.getJobStateRecords(query, from, size, '_updated:asc')
            .then((errorStates) => {
                res.status(200).json(errorStates);
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`could not get errors from job: ${jobId}, ex_id: ${exId}, error: ${errMsg}`);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/ex', (req, res) => {
        const status = req.query.status;
        const from = req.query.from;
        const size = req.query.size;
        const sort = req.query.sort;
        logger.debug(`GET /ex endpoint has been called, status: ${status}, from: ${from}, size: ${size}, sort: ${sort}`);

        jobsService.searchExecutionContexts(status, from, size, sort)
            .then(results => res.status(200).json(results))
            .catch((err) => {
                logger.error(`Error: could not retrieve list of execution contexts. ${parseError(err)}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            });
    });

    app.get('/ex/:ex_id', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`GET /ex/:ex_id endpoint has been called, ex_id: ${exId}`);

        jobsService.getExecutionContext(exId)
            .then(results => res.status(200).json(results))
            .catch((err) => {
                logger.error(`Error: could not retrieve list of execution contexts. ${parseError(err)}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            });
    });

    app.post('/ex/:ex_id/_stop', (req, res) => {
        const exId = req.params.ex_id;
        logger.debug(`POST /ex/:ex_id/_stop endpoint has been called, ex_id: ${exId}, removing any pending workers for the job`);
        clusterService.stopExecution(exId)
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
        clusterService.pauseExecution(exId)
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
        clusterService.resumeExecution(exId)
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
        jobsService.getExecutionContext(exId)
            .then(execution => _changeWorkers(execution.job_id, req.query))
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
                const errMsg = parseError(err);
                logger.error(`could not get slicer statistics, error: ${errMsg}`);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/cluster/stats', (req, res) => {
        logger.debug('GET /cluster/stats endpoint has been called');
        res.status(200).json(clusterService.getClusterStats());
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
        const workers = clusterService.findAllWorkers();
        const tableStr = makeTable(req, defaults, workers);
        res.status(200).send(tableStr);
    });

    app.get('/txt/nodes', (req, res) => {
        logger.debug('GET /txt/nodes endpoint has been called');

        const defaults = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];
        const nodes = clusterService.getClusterState();

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
                const errMsg = parseError(err);
                logger.error(`Error getting all jobs, error: ${errMsg}`);
                sendError(res, 500, errMsg);
            });
    });

    app.get('/txt/ex', (req, res) => {
        logger.debug('GET /txt/ex endpoint has been called');
        const defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        let size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }

        jobsService.searchExecutionContexts(null, null, size, '_updated:desc')
            .then((jobs) => {
                const tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr);
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error getting all execution contexts, error: ${errMsg}`);
                sendError(res, 500, err.message);
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
                const transform = _.map(results, (slicer) => {
                    const stats = slicer.stats;
                    _.assign(slicer, stats);
                    delete slicer.stats;
                    return slicer;
                });
                const tableStr = makeTable(req, defaults, transform);
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

    function _changeWorkers(jobId, query) {
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
            return jobsService.addWorkers(jobId, workerNum);
        }

        if (msg === 'remove') {
            return jobsService.removeWorkers(jobId, workerNum);
        }

        return jobsService.setWorkers(jobId, workerNum);
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
        return clusterService.getSlicerStats(exId);
    }

    function shutdown() {
        logger.info('shutting down');
        return Promise.resolve(true);
    }

    const api = {
        shutdown
    };

    return Promise.resolve(api);
};
