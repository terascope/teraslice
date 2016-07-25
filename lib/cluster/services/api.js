'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var event = require('../../utils/events');
var exceptions = require('../../utils/exceptions');
var Table = require('easy-table');

function getData(req, res, next) {
    var body = '';

    req.on('data', function(data) {
        body += data
    });

    req.on('end', function() {

        if (body) {
            try {
                req.body = JSON.parse(body);
                // TODO: this next() here may have the side effect of making this catch the default error handler.
                next();
            }
            catch (err) {
                sendError(res, 500, 'Error: JSON parsing exception. ' + err);
            }
        }
        else {
            next();
        }
    })
}

function sendError(res, code, error) {
    res.status(code).json({
        error: code,
        message: error
    });
}

module.exports = function(context, app, cluster_service, jobs_service) {
    var logger = context.logger;

    app.use(getData);

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

            jobs_service.submitJob(job_spec)
                .then(function(job_id) {
                    res.status(202).json({job_id: job_id});
                })
                .catch(function(err) {
                    sendError(res, 500, 'Job submission failed ' + err);
                });
        }
    });

    app.get('/jobs', function(req, res) {
        jobs_service.getJobs(req.query.status, req.query.from, req.query.size)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                logger.error('Error: could not retrieve list of jobs. ' + err);
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
                logger.error("Error: could not retrieve job: " + err);
                sendError(res, 500, 'Could not retrieve job');
            });
    });

    app.post('/jobs/:id/_stop', function(req, res) {
        //remove any pending workers
        cluster_service.removeFromQueue(req.params.id);
        _notifyJob(req.params.id, 'stop', res);
    });

    app.post('/jobs/:id/_pause', function(req, res) {
        _notifyJob(req.params.id, 'pause', res);
    });

    app.post('/jobs/:id/_resume', function(req, res) {
        _notifyJob(req.params.id, 'resume', res);
    });

    app.post('/jobs/:id/_start', function(req, res) {
        var job_id = req.params.id;
        var recover_job = false;

        if (req.query.recover === 'true') {
            recover_job = true;
        }

        jobs_service.startJob(job_id, recover_job)
            .then(function(status) {
                res.status(200).json({status: status});
            })
            .catch(exceptions.JobStateError, function(err) {
                logger.error(err);
                sendError(res, 500, err.message);
            })
            .catch(function(err) {
                logger.error("Error: could not start job: " + err);
                sendError(res, 500, 'Could not start job');
            });
    });

    app.get('/jobs/:id/slicer', function(req, res) {
        var job_id = req.params.id;
        slicerStats(job_id)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                sendError(res, err.code, err.message);
            })

    });

    app.get('/jobs/:id/stats', function(req, res) {
        var job_id = req.params.id;
        sendError(res, 500, 'Not yet implemented');
        // TODO: Impl.
    });

    app.put('/jobs/:id', function(req, res) {
        var job_id = req.params.id;

        var job_spec = req.body;

        jobs_service.updateJob(job_id, job_spec)
            .then(function(status) {
                res.status(200).json(status);
            })
            .catch(function(err) {
                logger.error("Error: could not update job: " + err);
                sendError(res, 500, 'Could not update job');
            });
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
        var defaults = ['assignment', 'node_id', 'job_id', 'pid'];
        var workers = cluster_service.findAllWorkers();

        var tableStr = makeTable(req, defaults, workers);
        res.status(200).send(tableStr)
    });

    app.get('/txt/nodes', function(req, res) {
        var defaults = ['node_id', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];
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
        var defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'job_id', '_created', '_updated'];
        var size = 10000;

        if (req.query.size && !isNaN(req.query.size) && req.query.size >= 0) {
            size = req.query.size;
        }

        jobs_service.getJobs(null, null, size, '_updated:desc')
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
            'job_id',
            'available_workers',
            'active_workers',
            'workers_joined',
            'reconnected_workers',
            'workers_disconnected',
            'failed',
            'subslices',
            'queued',
            'zero_slice_reduction',
            'processed',
            'subslice_by_key',
            'slicers'
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

    function _notifyJob(job_id, state, res) {
        jobs_service.notify(job_id, state)
            .then(function(status) {
                res.status(200).json({status: status})
            })
            .catch(function(err) {
                logger.error('Error: could not ' + state + ' job: ' + err.stack);
                sendError(res, 500, 'Could not ' + state + ' job');
            });
    }

    function slicerStats(job_id) {

        return new Promise(function(resolve, reject) {

            var list;
            var timer;
            var nodeQueries = [];

            if (job_id) {
                list = cluster_service.findSlicersByJobID(job_id);
            }
            else {
                list = cluster_service.findAllSlicers();
            }
            var numberOfCalls = list.length;

            if (numberOfCalls === 0) {
                if (job_id) {
                    reject({message: 'Could not find active slicer for job_id:' + job_id, code: 404})
                }
                else {
                    //for the general slicer stats query, just return a empty array
                    resolve([])
                }
            }

            _.each(list, function(slicer) {
                var msg = {job_id: slicer.job_id};
                nodeQueries.push(cluster_service.notifyNode(slicer.node_id, 'cluster_service:slicer_analytics', msg))
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
            }, context.sysconfig.teraslice.cluster.timeout)
        });
    }

    function shutdown() {
        logger.info("ApiService: shutting down.");
        return Promise.resolve(true);
    }

    var api = {
        shutdown: shutdown
    };

    return Promise.resolve(api);
};