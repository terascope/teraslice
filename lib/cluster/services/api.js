'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var parseError = require('../../utils/error_utils').parseError;
var request = require('request');
var makeTable = require('../../utils/api_utils').makeTable;
var sendError = require('../../utils/api_utils').sendError;
var messageModule = require('./messaging');

module.exports = function(context) {
    var logger = context.foundation.makeLogger('api', 'api', {module: 'api_service'});
    var assetsUrl = `http://${context.sysconfig.teraslice.master_hostname}:${process.env.assets_port}`;
    var app = require('express')();

    var messaging = messageModule(context, logger);


    app.use(bodyParser.json({
        type: function(req) {
            return (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded');
        }
    }));

    app.set('json spaces', 4);

    app.get('/cluster/state', function(req, res) {
        messaging.notifyService('cluster_service', {method: 'getClusterState'})
            .then(function(ipcResponse) {
                res.status(200).json(ipcResponse.data);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(errMsg);
                res.status(500).json({error: errMsg})
            })

    });

    app.route('/assets*')
        .delete(redirect)
        .post(function(req, res) {
            if (req.headers['content-type'] === 'application/json' || req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                sendError(res, 300, '/asset endpoints do not accept json');
                return;
            }
            redirect(req, res)
        });

    app.route('/txt/assets*')
        .get(redirect);


    app.post('/jobs', function(req, res) {
        //if no job was posted an empty object is returned, so we check if it has values 
        if (!req.body.operations) {
            sendError(res, 400, 'No job was posted');
        }
        else {
            var job_spec = req.body;
            var shouldRun = true;

            if (req.query.hasOwnProperty('start') && req.query.start === 'false') {
                shouldRun = false;
            }
            logger.debug(`POST /jobs endpoint has received shouldRun: ${shouldRun}, job:`, job_spec);

            messaging.notifyService('jobs_service', {method: 'submitJob', args: [job_spec, shouldRun]})
                .then(function(ipcResponse) {
                    res.status(202).json(ipcResponse.data);
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    logger.error(`Could not submit job, error: ${errMsg}`);
                    sendError(res, 500, `Job submission failed: ${errMsg}`);
                });
        }
    });

    app.get('/jobs', function(req, res) {
        logger.debug(`GET /jobs endpoint has been called, from: ${req.query.from}, size: ${req.query.size}, sort: ${req.query.sort}`);

        messaging.notifyService('jobs_service', {
            method: 'getJobs',
            args: [req.query.from, req.query.size, req.query.sort]
        })
            .then(function(ipcResponse) {
                res.status(200).json(ipcResponse.data);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not retrieve list of jobs, ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of jobs.');
            });
    });

    app.get('/jobs/:job_id', function(req, res) {
        var job_id = req.params.job_id;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${job_id}`);

        messaging.notifyService('jobs_service', {method: 'getJob', args: [job_id]})
            .then(function(ipcResponse) {
                res.status(200).json(ipcResponse.data);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not retrieve job: ${errMsg}`);
                sendError(res, 500, 'Could not retrieve job');
            });

    });

    app.put('/jobs/:job_id', function(req, res) {
        var job_id = req.params.job_id;

        var job_spec = req.body;

        if (Object.keys(job_spec).length === 0) {
            sendError(res, 300, `no data was provided to update job ${job_id}`);
            return
        }
        logger.debug(`PUT /jobs/:job_id endpoint has been called, job_id: ${job_id}, update changes: `, job_spec);

        messaging.notifyService('jobs_service', {method: 'updateJob', args: [job_id, job_spec]})
            .then(function(ipcResponse) {
                res.status(200).json(ipcResponse.data);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not update job: ${errMsg}`);
                sendError(res, 500, 'Could not update job');
            });

    });

    app.post('/jobs/:job_id/_start', function(req, res) {
        var job_id = req.params.job_id;
        if (!job_id) {
            sendError(res, 400, 'no job_id was posted');
        }
        logger.debug(`GET /jobs/:job_id/_start endpoint has been called, job_id: ${job_id}`);

        messaging.notifyService('jobs_service', {method: 'startJob', args: [job_id]})
            .then(function(ipcResponse) {
                res.status(200).json(ipcResponse.data);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not start job: ${errMsg}`);
                sendError(res, 500, `Could not start job: ${job_id}`);
            });

    });

    app.get('/ex', function(req, res) {
        logger.debug(`GET /jobs endpoint has been called, status: ${req.query.status}, from: ${req.query.from}, size: ${req.query.size}, sort: ${req.query.sort}`);

        messaging.notifyService('jobs_service', {
            method: 'getExecutionContexts',
            args: [req.query.status, req.query.from, req.query.size, req.query.sort]
        })
            .then(function(ipcResponse) {
                res.status(200).json(ipcResponse.data);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not retrieve list of execution contexts. ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            });
    });

    app.get('/ex/:ex_id', function(req, res) {
        var ex_id = req.params.ex_id;
        logger.debug(`GET /ex/:ex_id endpoint has been called, ex_id: ${ex_id}`);

        messaging.notifyService('jobs_service', {method: 'getExecutionContext', args: [ex_id]})
            .then(function(ipcResponse) {
                res.status(200).json(ipcResponse.data);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not retrieve list of execution contexts. ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            });
    });

    app.post('/ex/:ex_id/_stop', function(req, res) {
        logger.debug(`POST /ex/:ex_id/_stop endpoint has been called, ex_id: ${req.params.ex_id}, removing any pending workers for the job`);

        messaging.notifyService('cluster_service', {method: 'removeFromQueue', args: [req.params.ex_id]})
            .then(function(ipcResponse) {
                _notifyExecutionContext(req.params.ex_id, 'stop', res);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not retrieve list of execution contexts. ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            });

    });

    app.post('/ex/:ex_id/_pause', function(req, res) {
        logger.debug(`POST /ex_id/:id/_pause endpoint has been called, ex_id: ${req.params.ex_id}`);
        _notifyExecutionContext(req.params.ex_id, 'pause', res);
    });

    app.post('/ex/:ex_id/_resume', function(req, res) {
        logger.debug(`POST /ex/:id/_resume endpoint has been called, ex_id: ${req.params.ex_id}`);
        _notifyExecutionContext(req.params.ex_id, 'resume', res);
    });

    app.post('/ex/:ex_id/_recover', function(req, res) {
        var ex_id = req.params.ex_id;
        logger.debug(`POST /ex/:id/_recover endpoint has been called, ex_id: ${ex_id}`);

        messaging.notifyService('jobs_service', {method: 'restartExecution', args: [ex_id]})
            .then(function(ipcResponse) {
                res.status(200).json({status: ipcResponse.data});
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not start job: ${errMsg}`);
                sendError(res, 500, 'Could not start job');
            });
    });

    app.post('/ex/:ex_id/_workers', function(req, res) {
        logger.debug(`POST /ex/:id/_workers endpoint has been called, query:`, req.query);
        changeWorkers(req, res);
    });

    app.get('/ex/:ex_id/slicer', function(req, res) {
        logger.debug(`GET /ex/:ex_id/slicer endpoint has been called, ex_id: ${req.params.ex_id}`);

        var ex_id = req.params.ex_id;
        slicerStats(ex_id)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not get slicer statistics, error: ${errMsg}`);
                sendError(res, err.code, errMsg);
            })

    });

    app.get('/ex/:ex_id/stats', function(req, res) {
        var ex_id = req.params.ex_id;
        sendError(res, 500, 'Not yet implemented');
        // TODO: Impl.
    });

    app.get('/cluster/slicers', function(req, res) {
        logger.debug(`GET /cluster/slicers endpoint has been called`);

        slicerStats()
            .then(function(results) {
                res.status(200).send(results);
            })
            .catch(function(err) {
                sendError(res, err.code, err.message);
            })
    });

    app.get('/txt/workers', function(req, res) {
        logger.debug(`GET /txt/workers endpoint has been called`);

        var defaults = ['assignment', 'ex_id', 'node_id', 'pid'];

        messaging.notifyService('cluster_service', {method: 'findAllWorkers', args: []})
            .then(function(ipcResponse) {
                var workers = ipcResponse.data;
                var tableStr = makeTable(req, defaults, workers);
                res.status(200).send(tableStr)
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not get list of workers: ${errMsg}`);
                sendError(res, 500, 'could not get list of workers');
            });

    });

    app.get('/txt/nodes', function(req, res) {
        logger.debug(`GET /txt/nodes endpoint has been called`);

        var defaults = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];

        messaging.notifyService('cluster_service', {method: 'getClusterState', args: []})
            .then(function(ipcResponse) {
                var nodes = ipcResponse.data;
                var transform = _.map(nodes, function(node) {
                    var size = node.active.length;
                    node.active = size;
                    return node;
                });

                var tableStr = makeTable(req, defaults, transform);
                res.status(200).send(tableStr)
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not get list of nodes: ${errMsg}`);
                sendError(res, 500, 'could not get list of nodes');
            });

    });

    app.get('/txt/jobs', function(req, res) {
        logger.debug(`GET /txt/jobs endpoint has been called`);

        var defaults = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];

        var size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }

        messaging.notifyService('jobs_service', {method: 'getJobs', args: [null, size, '_updated:desc']})
            .then(function(ipcResponse) {
                var tableStr = makeTable(req, defaults, ipcResponse.data);
                res.status(200).send(tableStr)
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error getting all jobs, error: ${errMsg}`);
                sendError(res, 500, errMsg);
            });

    });

    app.get('/txt/ex', function(req, res) {
        logger.debug(`GET /txt/ex endpoint has been called`);

        var defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        var size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }

        messaging.notifyService('jobs_service', {
            method: 'getExecutionContexts',
            args: [null, null, size, '_updated:desc']
        })
            .then(function(ipcResponse) {
                var tableStr = makeTable(req, defaults, ipcResponse.data);
                res.status(200).send(tableStr)
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error getting all execution contexts, error: ${errMsg}`);
                sendError(res, 500, errMsg);
            });

    });

    app.get('/txt/slicers', function(req, res) {
        logger.debug(`GET /txt/slicers endpoint has been called`);

        var defaults = [
            'ex_id',
            'workers_available',
            'workers_active',
            'failed',
            'queued',
            'processed',
            'subslice_by_key'
        ];

        slicerStats()
            .then(function(results) {
                var transform = _.map(results, function(slicer) {
                    var stats = slicer.stats;
                    _.assign(slicer, stats);
                    delete slicer.stats;
                    return slicer;
                });
                var tableStr = makeTable(req, defaults, transform);
                res.status(200).send(tableStr)

            })
            .catch(function(err) {
                sendError(res, err.code, err.message);
            })
    });

    // This is a catch all, any none supported api endpoints will return an error
    app.route('*')
        .all(function(req, res, next) {
            sendError(res, 405, `cannot ${req.method} endpoint ${req.originalUrl}`);

        });


    function changeWorkers(req, res) {

        if (!req.query) {
            sendError(res, 400, 'Must provide a query parameter in request');
            return
        }

        var ex_id = req.params.id;
        var keyOptions = {add: true, remove: true, total: true};
        var jobState = {running: true, failing: true, paused: true};
        var queryKeys = Object.keys(req.query);
        var msg, workerNum;

        queryKeys.forEach(function(key) {
            if (keyOptions[key]) {
                msg = key;
                workerNum = Number(req.query[key])
            }
        });

        if (!msg || isNaN(workerNum) || workerNum <= 0) {
            sendError(res, 400, 'Must provide a valid worker parameter(add/remove/total) that is a number and greater than zero');
        }
        else {
            //this could either be an add or remove

            messaging.notifyService('cluster_service', {
                method: 'findWorkersByExecutionID',
                args: [ex_id]
            })
                .then(function(ipcResponse) {
                    if (msg === 'total') {
                        var totalWorker = ipcResponse.data.length;

                        if (totalWorker > workerNum) {
                            msg = 'remove';
                            workerNum = totalWorker - workerNum;
                        }
                        if (totalWorker < workerNum) {
                            msg = 'add';
                            workerNum = workerNum - totalWorker;
                        }
                    }

                    return messaging.notifyService('jobs_service', {method: 'getExecutionContext', args: [ex_id]})
                })
                .then(function(ipcResponse) {
                    var ex = ipcResponse.data;
                    if (jobState[ex._status]) {
                        if (msg === 'add') {
                            var workerRequest = {
                                ex_id: ex_id,
                                id: ex_id,
                                workers: workerNum,
                                assignment: 'worker',
                                job: JSON.stringify(ex)
                            };

                            messaging.notifyService('cluster_service', {method: 'addToQueue', args: [workerRequest]})
                                .then(function(ipcResponse) {
                                    res.status(200).send(`${workerNum} workers have been enqueued for job: ${ex_id}`);
                                })
                                .catch(function(err) {
                                    var errMsg = parseError(err);
                                    logger.error(`Error adding workers to queue, error: ${errMsg}`);
                                    sendError(res, 500, errMsg);
                                });

                            return;
                        }
                        if (msg === 'remove') {
                            messaging.notifyService('cluster_service', {
                                method: 'removeWorkers',
                                args: [res, ex_id, workerNum]
                            })
                                .then(function(ipcResponse) {
                                    res.status(200).send(`${workerNum} workers have been removed for job: ${ex_id}`);
                                })
                                .catch(function(err) {
                                    var errMsg = parseError(err);
                                    logger.error(`Error removing workers to queue, error: ${errMsg}`);
                                    sendError(res, 500, errMsg);
                                });
                        }
                    }
                    else {
                        res.status(200).send('Job is not in an active state, cannot add/remove workers');
                    }
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    logger.error(`Error changing the amout of workers for ex_id: ${ex_id}, error: ${errMsg}`);
                    sendError(res, 404, errMsg)
                });
        }
    }


    function redirect(req, res) {
        req.pipe(request({method: req.method, url: `${assetsUrl}${req.url}`}).on('response', function(assetsResponse) {
            assetsResponse.pipe(res)
        }));
    }

    function _notifyExecutionContext(ex_id, state, res) {

        messaging.notifyService('jobs_service', {
            method: 'notify',
            args: [ex_id, state]
        })
            .then(function(ipcResponse) {
                res.status(200).json({status: ipcResponse.data})
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not ${state} job: ${errMsg}`);
                sendError(res, 500, `Could not ${state} job, error: ${errMsg}`);
            });
    }

    function getSlicerList(ex_id) {
        return new Promise(function(resolve, reject) {
            if (ex_id) {
                messaging.notifyService('cluster_service', {
                    method: 'findSlicersByExecutionID',
                    args: [ex_id]
                })
                    .then(function(ipcResponse) {
                        resolve(ipcResponse.data)
                    })
                    .catch(function(err) {
                        var errMsg = parseError(err);
                        logger.error(`could not get slicer list, error: ${errMsg}`);
                        reject(${errMsg});
                    });
            }
            else {

                messaging.notifyService('cluster_service', {
                    method: 'findAllSlicers',
                    args: []
                })
                    .then(function(ipcResponse) {
                        resolve(ipcResponse.data)
                    })
                    .catch(function(err) {
                        var errMsg = parseError(err);
                        logger.error(`could not get slicer list, error: ${errMsg}`);
                        reject(errMsg);
                    });
            }
        })
    }

    function slicerStats(ex_id) {
        return new Promise(function(resolve, reject) {
            var list;
            var timer;
            var nodeQueries = [];

            getSlicerList(ex_id)
                .then(function(_list) {
                    list = _list;
                    var numberOfCalls = list.length;

                    if (numberOfCalls === 0) {
                        if (ex_id) {
                            reject({message: `Could not find active slicer for ex_id: ${ex_id}`, code: 404})
                        }
                        else {
                            //for the general slicer stats query, just return a empty array
                            resolve([])
                        }
                    }

                    _.each(list, function(slicer) {
                        var msg = {ex_id: slicer.ex_id};
                        nodeQueries.push(
                            messaging.notifyService('cluster_service', {
                                method: 'notifyNode',
                                args: [slicer.node_id, 'cluster:slicer:analytics', msg]
                            })
                        )
                    });

                    return Promise.all(nodeQueries)
                })
                .then(function(results) {
                    clearTimeout(timer);
                    resolve(results.map(function(slicer) {
                        return slicer.data
                    }))
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    reject({message: errMsg, code: 500})
                });

            timer = setTimeout(function() {
                reject({message: 'Timeout has occurred for query', code: 500})
            }, context.sysconfig.teraslice.timeout)
        });
    }

    //TODO fix this
    function shutdown() {
        logger.info("shutting down");
        Promise.resolve(true);
        process.exit()
    }

    messaging.register('worker:shutdown', shutdown);


    var api = {
        shutdown: shutdown
    };

    //return Promise.resolve(api);
    var server = app.listen(context.sysconfig.teraslice.port)
};