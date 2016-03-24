'use strict';

//TODO verify if I can seperate validation code out of initilization of job in config code
//TODO need job validations on post to /jobs
//TODO need proper valiadations on cluster sysconfigs


//TODO getting race condition on calc stats, as soon as job is done it emits that its done
//it might not get the rest of the data back before processing it
var _ = require('lodash');
var addID = require('../utils/config').addID;

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

module.exports = function(context) {
    var logger = context.logger;
    var clusterConfig = context.sysconfig.teraslice.cluster;
    var app = require('express')();

    var server = app.listen(clusterConfig.port);
    logger.info('Cluster master is listening on port ' + clusterConfig.port);

    var io = require('socket.io')(server);
    var distributeJob = require('../utils/cluster').distributeJob;
    var outstandingJobRequests = require('../utils/cluster').outstandingJobRequests;
    var jobAction = require('../utils/cluster').jobAction;


    var clusterState = {};

    //used to keep track of outstanding worker requests for a given job
    var jobRequest = {};

    app.use(getData);

    app.get('/getState', function(req, res) {
        res.status(200).send(JSON.stringify(clusterState, null, 4))
    });

    app.post('/job', function(req, res) {
        //TODO have job validations
        var job = addID(req.body);
        distributeJob(context, clusterState, io, res, job, jobRequest);
    });

    app.post('/job/:id', function(req, res) {
        jobAction(req, res, io, clusterState)
    });

    //TODO switch it to /job/:id/analytics
    app.get('/analytics', function(req, res) {
        var data = req.body;
        var query = {index: data.index};

        //need validations and defaults

        //get req.body data
        //get client
        //run aggregations
    });

    var debouncedJobRequest = _.debounce(function() {
        outstandingJobRequests(io, clusterState, jobRequest);
    }, 500, {leading: false, trailing: true});

    io.on('connection', function(socket) {

        socket.on('node online', function(data) {
            logger.info('node ', data.id, ' has connected to cluster master');
            socket.join(data.id);
            clusterState[data.id] = data;
            //if new node comes online, check if jobs need more workers
            outstandingJobRequests(io, clusterState, jobRequest)
        });

        socket.on('job finished', function(jobID) {
            //need to remove any request for additional workers before shutting down workers of completed job
            if (jobRequest[jobID]) {
                delete jobRequest[jobID];
            }

            io.emit('terminate job', jobID);
        });

        socket.on('node state', function(data) {
            clusterState[data.id] = data;
            //if worker became available check if jobs need more workers
            debouncedJobRequest()
        });

        socket.on('disconnect', function(server) {
            console.log('getting a disconnect', server)
        });

        socket.on('error', function(ev) {
            logger.error(ev)
        })

    });

    setInterval(function() {
        io.emit('get node state')
    }, 5000)

};
