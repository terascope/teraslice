'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var event = require('../../utils/events');
var exceptions = require('../../utils/exceptions');

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

    app.get('/cluster/_state', function(req, res) {
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

    app.get('/jobs/:id/_slicer-stats', function(req, res) {
        var job_id = req.params.id;
        slicerStats(job_id)
            .then(function(results) {
                res.status(200).json(results);
            })
            .catch(function(err) {
                sendError(res, err.code, err.message);
            })

    });

    app.get('/cluster/_slicers', function(req, res) {

        slicerStats()
            .then(function(results) {
                res.status(200).send(results);
            })
            .catch(function(err) {
                sendError(res, err.code, err.message);
            })
    });

    app.get('/jobs/:id/_stats', function(req, res) {
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

    function _notifyJob(job_id, state, res) {
        jobs_service.notify(job_id, state)
            .then(function(status) {
                res.status(200).json({status: status})
            })
            .catch(function(err) {
                logger.error('Error: could not ' + state + ' job: ' + err);
                sendError(res, 500, 'Could not ' + state + ' job');
            });
    }

    function slicerStats(job_id) {

        return new Promise(function(resolve, reject) {

            var list;
            var timer;
            var msg = {};
            var nodeQueries = [];
            var results = [];
            var counter = 0;

            if (job_id) {
                list = cluster_service.findSlicersByJobID(job_id);
                msg.job_id = job_id;
            }
            else {
                list = cluster_service.findAllSlicers();
            }
            var numberOfCalls = list.length;

            if (numberOfCalls === 0) {
                if (job_id) {
                    reject({message:'Could not find active slicer for job_id:' + job_id, code: 404})
                }
                else {
                    //for the general slicer stats query, just return a empty array
                    resolve([])
                }
            }

            //set listener for notify node message

            event.on('slicer:slicer_analytics', function(stats) {
                results.push(stats.data);
                counter += 1;

                if (counter === numberOfCalls) {
                    clearTimeout(timer);
                    resolve(results);
                }
            });

            _.each(list, function(slicer) {
                nodeQueries.push(cluster_service.notifyNode(slicer.node_id, 'cluster_service:slicer_analytics', msg))
            });

            Promise.all(nodeQueries).catch(function(err) {
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