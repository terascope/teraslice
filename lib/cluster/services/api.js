'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var parseError = require('../../utils/error_utils').parseError;
var Table = require('easy-table');
var zlib = require('zlib');


module.exports = function(context, app, services) {
    var logger = context.foundation.makeLogger('api', 'api', {module: 'api_service'});
    var cluster_service = services[0];
    var jobs_service = services[2];
    var assests_service = services[1];
    app.use(bodyParser.json({type: 'application/*'}));
    app.set('json spaces', 4);

    app.get('/cluster/state', function(req, res) {
        res.status(200).json(cluster_service.getClusterState());
    });
    
    app.post('/assets', function(req, res){
        var results = [];
        req.on('data', function(buff){results.push(buff)});
        
        req.on('end', function(){
            var data = Buffer.concat(results);
            assests_service.save(data.toString('base64'))
        });
        res.send('ok')
    });

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
            jobs_service.submitJob(job_spec, shouldRun)
                .then(function(ids) {
                    res.status(202).json(ids);
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
        jobs_service.getJobs(req.query.from, req.query.size, req.query.sort)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not retrieve list of jobs, ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of jobs.');
            })
    });

    app.get('/jobs/:job_id', function(req, res) {
        var job_id = req.params.job_id;
        logger.debug(`GET /jobs/:job_id endpoint has been called, job_id: ${job_id}`);

        jobs_service.getJob(job_id)
            .then(function(job_spec) {
                res.status(200).json(job_spec);
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
        logger.debug(`PUT /jobs/:job_id endpoint has been called, job_id: ${job_id}, update changes: `, job_spec);

        jobs_service.updateJob(job_id, job_spec)
            .then(function(status) {
                res.status(200).json(status);
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

        jobs_service.startJob(job_id)
            .then(function(ids) {
                res.status(200).json(ids);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not start job: ${errMsg}`);
                sendError(res, 500, 'Could not start job');
            });
    });

    app.get('/ex', function(req, res) {
        logger.debug(`GET /jobs endpoint has been called, status: ${req.query.status}, from: ${req.query.from}, size: ${req.query.size}, sort: ${req.query.sort}`);

        jobs_service.getExecutionContexts(req.query.status, req.query.from, req.query.size, req.query.sort)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not retrieve list of execution contexts. ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            })
    });

    app.get('/ex/:ex_id', function(req, res) {
        var ex_id = req.params.ex_id;
        logger.debug(`GET /ex/:ex_id endpoint has been called, ex_id: ${ex_id}`);

        jobs_service.getExecutionContext(ex_id)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not retrieve list of execution contexts. ${errMsg}`);
                sendError(res, 500, 'Error: could not retrieve list of execution contexts.');
            })
    });

    app.post('/ex/:ex_id/_stop', function(req, res) {
        logger.debug(`POST /ex/:ex_id/_stop endpoint has been called, ex_id: ${req.params.ex_id}, removing any pending workers for the job`);

        //remove any pending workers
        cluster_service.removeFromQueue(req.params.ex_id);
        _notifyExecutionContext(req.params.ex_id, 'stop', res);
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
        logger.debug(`POST /ex/:id/_recover endpoint has been called, ex_id: ${req.params.ex_id}`);

        jobs_service.restartExecution(ex_id)
            .then(function(status) {
                res.status(200).json({status: status});
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
        var workers = cluster_service.findAllWorkers();
        var tableStr = makeTable(req, defaults, workers);
        res.status(200).send(tableStr)
    });

    app.get('/txt/nodes', function(req, res) {
        logger.debug(`GET /txt/nodes endpoint has been called`);

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
        logger.debug(`GET /txt/jobs endpoint has been called`);

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

        jobs_service.getExecutionContexts(null, null, size, '_updated:desc')
            .then(function(jobs) {
                var tableStr = makeTable(req, defaults, jobs);
                res.status(200).send(tableStr)
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error getting all execution contexts, error: ${errMsg}`);
                sendError(res, 500, err.message);
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
            var results = query.fields.split(',').map(word => word.trim());

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
                    var errMsg = parseError(err);
                    logger.error(`Error changing the amout of workers for ex_id: ${ex_id}, error: ${errMsg}`);
                    sendError(res, 404, errMsg)
                });
        }
    }

    function _notifyExecutionContext(ex_id, state, res) {
        jobs_service.notify(ex_id, state)
            .then(function(status) {
                res.status(200).json({status: status})
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error: could not ${state} job: ${errMsg}`);
                sendError(res, 500, `Could not ${state} job, error: ${errMsg}`);
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
                    var errMsg = parseError(err);
                    reject({message: errMsg, code: 500})
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