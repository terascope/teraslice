'use strict';

var _ = require('lodash');

var Promise = require('bluebird');

function getData(req, res, next) {
    var body = '';

    req.on('data', function(data) {
        body += data
    });

    req.on('end', function() {
        if (body) {
            req.body = JSON.parse(body);
        }
        next();
    })
}

module.exports = function(context, app, cluster_service, jobs_service) {
    var logger = context.logger;

    app.use(getData);

    app.get('/cluster/_state', function(req, res) {
// TODO: this needs to use cluster_service
        res.status(200).send(JSON.stringify(cluster_service.getClusterState(), null, 4))
    });

    app.post('/jobs', function(req, res) {
        //TODO have job validations

        if (! req.body) {
            res.status(400).send('Error: no job was posted')
        }
        else {
            var job_spec = req.body;

            jobs_service.submitJob(job_spec)
                .then(function(job_id) {
                    res.status(202).json({ job_id: job_id });
                })
                .error(function(err) {
                    res.status(500).send('Error: job submission failed ' + err);
                });
        }
    });

    app.get('/jobs', function(req, res) {
        jobs_service.getJobs(req.query.status, req.query.from, req.query.size)
            .then(function(results) {
                res.status(200).json(results);
            })
            .error(function(err) {
                logger.error('Error: could not retrieve list of jobs. ' + err);
                res.status(500).send('Error: could not retrieve list of jobs.');
            })
    })

    app.get('/jobs/:id', function(req, res) {
        var job_id = req.params.id;

        jobs_service.getJob(job_id)
            .then(function(job_spec) {
                res.status(200).json(job_spec);
            })
            .error(function(err) {
                logger.error("Error: could not retrieve job: " + err);
                res.status(500).send('Error: could not retrieve job');
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
       jobs_service.startJob(job_id)
            .then(function(status) {
                res.status(200).json(status);
            })
            .error(function(err) {
                logger.error("Error: could not retrieve job: " + err);
                res.status(500).send('Error: could not retrieve job');
            });
    });

    app.get('/jobs/:id/_stats', function(req, res) {
        var job_id = req.params.id;
// TODO: Impl.
    });

    app.put('/jobs/:id', function(req, res) {
        var job_id = req.params.id;

        var job_spec = req.body;

        jobs_service.updateJob(job_id, job_spec)
            .then(function(status) {
                res.status(200).json(status);
            })
            .error(function(err) {
                logger.error("Error: could not retrieve job: " + err);
                res.status(500).send('Error: could not retrieve job');
            });
    });

    function _notifyJob(job_id, state, res) {
        jobs_service.notify(job_id, state)
            .then(function(status) {
                res.status(200).json({ status: status })
            })
            .error(function(err) {
                logger.error("Error: could not ' + state + ' job: " + err);
                res.status(500).send('Error: could not ' + state + ' job');
            });
    }
}