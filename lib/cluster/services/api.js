'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var elasticError = require('../../utils/error_utils').elasticError;
var exceptions = require('../../utils/exceptions');
var Table = require('easy-table');


module.exports = function(context, app, cluster_service, jobs_service) {
    var logger = context.foundation.makeLogger('api', 'api', {module: 'api_service'});

    app.use(bodyParser.json({type: 'application/*'}));
    app.set('json spaces', 4);

    app.get('/cluster/state', function(req, res) {
        res.status(200).json(cluster_service.getClusterState());
    });

    app.post('/jobs', function(req, res) {
        if (!req.body) {
            sendError(res, 400, 'No job was posted');
        }
        else {
            var job_spec = req.body;
            var shouldRun = true;

            if (req.query.hasOwnProperty('start') && req.query.start === 'false') {
                shouldRun = false;
            }

            jobs_service.submitJob(job_spec, shouldRun)
                .then(function(ids) {
                    res.status(202).json(ids);
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
                    sendError(res, 500, `Job submission failed: ${errMsg}`);
                });
        }
    });

    app.get('/jobs', function(req, res) {
        jobs_service.getJobs(req.query.from, req.query.size, req.query.sort)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`Error: could not retrieve list of jobs, ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of jobs.');
            })
    });

    app.get('/jobs/:id', function(req, res) {
        var job_id = req.params.id;

        jobs_service.getJob(job_id)
            .then(function(job_spec) {
                res.status(200).json(job_spec);
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`Error: could not retrieve job: ${errMsg}`);
                sendError(res, 500, 'Could not retrieve job');
            });
    });

    app.put('/jobs/:id', function(req, res) {
        var job_id = req.params.id;

        var job_spec = req.body;

        jobs_service.updateJob(job_id, job_spec)
            .then(function(status) {
                res.status(200).json(status);
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`Error: could not update job: ${errMsg}`);
                sendError(res, 500, 'Could not update job');
            });
    });

    app.post('/jobs/:id/_start', function(req, res) {
        var job_id = req.params.id;

        jobs_service.startJob(job_id)
            .then(function(ids) {
                res.status(200).json(ids);
            })
            .catch(exceptions.JobStateError, function(err) {
                logger.error(err);
                sendError(res, 500, err.message);
            })
            .catch(function(err) {
                logger.error(`Error: could not start job: ${err}`);
                sendError(res, 500, 'Could not start job');
            });
    });

    app.get('/ex', function(req, res) {
        jobs_service.getExecutionContexts(req.query.status, req.query.from, req.query.size, req.query.sort)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`Error: could not retrieve list of execution contexts. ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            })
    });

    app.get('/ex/:id', function(req, res) {
        var ex_id = req.params.id;

        jobs_service.getExecutionContext(ex_id)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`Error: could not retrieve list of execution contexts. ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            })
    });

    app.post('/ex/:id/_stop', function(req, res) {
        //remove any pending workers
        cluster_service.removeFromQueue(req.params.id);
        _notifyExecutionContext(req.params.id, 'stop', res);
    });

    app.post('/ex/:id/_pause', function(req, res) {
        _notifyExecutionContext(req.params.id, 'pause', res);
    });

    app.post('/ex/:id/_resume', function(req, res) {
        _notifyExecutionContext(req.params.id, 'resume', res);
    });

    app.post('/ex/:id/_recover', function(req, res) {
        var ex_id = req.params.id;

        jobs_service.restartExecution(ex_id)
            .then(function(status) {
                res.status(200).json({status: status});
            })
            .catch(exceptions.JobStateError, function(err) {
                logger.error(err);
                sendError(res, 500, err.message);
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`Error: could not start job: ${errMsg}`);
                sendError(res, 500, 'Could not start job');
            });
    });

    app.post('/ex/:id/_workers', function(req, res) {
        changeWorkers(req, res);
    });

    app.get('/ex/:id/slicer', function(req, res) {
        var ex_id = req.params.id;
        slicerStats(ex_id)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                sendError(res, err.code, err.message);
            })

    });

    app.get('/ex/:id/stats', function(req, res) {
        var job_id = req.params.id;
        sendError(res, 500, 'Not yet implemented');
        // TODO: Impl.
    });

    app.get('/cluster/slicers', function(req, res) {

        slicerStats()
            .then(function(results) {
                res.status(200).send(results);
            })
            .catch(function(err) {
                sendError(res, err.code, err.message);
            })
    });

    app.get('/txt/workers', function(req, res) {
        var defaults = ['assignment', 'ex_id', 'node_id', 'pid'];
        var workers = cluster_service.findAllWorkers();
        var tableStr = makeTable(req, defaults, workers);
        res.status(200).send(tableStr)
    });

    app.get('/txt/nodes', function(req, res) {
        var defaults = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];
        var nodes = cluster_service.getClusterState();

        var transform = _.map(nodes, function(node) {
            var size = node.active.length;
            node.active = size;
            return node;
        });

        var tableStr = makeTable(req, defaults, transform);
        res.status(200).send(tableStr)
    });

    app.get('/txt/jobs', function(req, res) {
        var defaults = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];

        var size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }

        jobs_service.getJobs(null, size, '_updated:desc')
            .then(function(jobs) {
                var tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr)
            })
            .catch(function(err) {
                //TODO decide how to log error
                sendError(res, 500, err.message);
            });
    });

    app.get('/txt/ex', function(req, res) {
        var defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        var size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }

        jobs_service.getExecutionContexts(null, null, size, '_updated:desc')
            .then(function(jobs) {
                var tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr)
            })
            .catch(function(err) {
                //TODO decide how to log error
                sendError(res, 500, err.message);
            });
    });

    app.get('/txt/slicers', function(req, res) {
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

    function makeTable(req, defaults, data) {
        var query = fieldsQuery(req.query, defaults);
        //used to create an empty table if there are no jobs
        if (data.length === 0) {
            data.push({})
        }

        return Table.print(data, function(item, cell) {
            _.each(query, function(field) {
                cell(field, item[field])
            });
        }, function(table) {
            if (req.query.hasOwnProperty('headers') && req.query.headers === 'false') {
                return table.print()
            }
            return table.toString()
        });
    }

    function fieldsQuery(query, defaults) {
        if (!query.fields) {
            return defaults ? defaults : [];
        }
        else {
            var results = _.words(query.fields);

            if (results.length === 0) {
                return defaults
            }
            else {
                return results;
            }
        }
    }

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
            if (msg === 'total') {
                var totalWorker = cluster_service.findWorkersByExecutionID(ex_id).length;

                if (totalWorker > workerNum) {
                    msg = 'remove';
                    workerNum = totalWorker - workerNum;
                }
                if (totalWorker < workerNum) {
                    msg = 'add';
                    workerNum = workerNum - totalWorker;
                }
            }

            jobs_service.getExecutionContext(ex_id)
                .then(function(ex) {
                    if (jobState[ex._status]) {
                        if (msg === 'add') {
                            var workerRequest = {
                                ex_id: ex_id,
                                id: ex_id,
                                workers: workerNum,
                                assignment: 'worker',
                                job: JSON.stringify(ex)
                            };

                            cluster_service.addToQueue(workerRequest);
                            res.status(200).send(`${workerNum} workers have been enqueued for job: ${ex_id}`);
                            return
                        }
                        if (msg === 'remove') {
                            cluster_service.removeWorkers(res, ex_id, workerNum);
                        }
                    }
                    else {
                        res.status(200).send('Job is not in an active state, cannot add/remove workers');
                    }
                })
                .catch(function(err) {
                    sendError(res, 404, JSON.stringify(err))
                });
        }
    }

    function _notifyExecutionContext(ex_id, state, res) {
        jobs_service.notify(ex_id, state)
            .then(function(status) {
                res.status(200).json({status: status})
            })
            .catch(function(err) {
                logger.error(`Error: could not ${state} job: ${err.stack}`);
                sendError(res, 500, `Could not ${state} job`);
            });
    }

    function sendError(res, code, error) {
        res.status(code).json({
            error: code,
            message: error
        });
    }

    function slicerStats(ex_id) {
        return new Promise(function(resolve, reject) {

            var list;
            var timer;
            var nodeQueries = [];

            if (ex_id) {
                list = cluster_service.findSlicersByExecutionID(ex_id);
            }
            else {
                list = cluster_service.findAllSlicers();
            }
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
                nodeQueries.push(cluster_service.notifyNode(slicer.node_id, 'cluster:slicer:analytics', msg))
            });

            Promise.all(nodeQueries)
                .then(function(results) {
                    clearTimeout(timer);
                    resolve(results.map(function(slicer) {
                        return slicer.data
                    }))
                })
                .catch(function(err) {
                    reject({message: err, code: 500})
                });

            timer = setTimeout(function() {
                reject({message: 'Timeout has occurred for query', code: 500})
            }, context.sysconfig.teraslice.timeout)
        });
    }

    function shutdown() {
        logger.info("shutting down");
        return Promise.resolve(true);
    }

    var api = {
        shutdown: shutdown
    };

    return Promise.resolve(api);
};