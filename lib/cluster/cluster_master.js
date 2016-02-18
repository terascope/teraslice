'use strict';

//TODO verify if I can seperate validation code out of initilization of job in config code
//TODO need job validations on post to /jobs
//TODO need proper valiadations on cluster sysconfigs


//TODO getting race condition on calc stats, as soon as job is done it emits that its done
//it might not get the rest of the data back before processing it


var shortid = require('shortid');


function addID(str) {
    if (str) {
        var obj = JSON.parse(str);
        obj.__id = shortid.generate();
        return JSON.stringify(obj);
    }
}

function getData(req, res, next) {
    var body = '';

    req.on('data', function(data) {
        body += data
    });

    req.on('end', function() {
        req.body = addID(body);
        next();
    })
}

module.exports = function(context) {
    var clusterConfig = context.sysconfig.teraslice.cluster;

    var app = require('express')();
    var server = app.listen(clusterConfig.port);
    var io = require('socket.io')(server);
    var distributeJob = require('../utils/cluster').distributeJob;
    var outstandingJobRequests = require('../utils/cluster').outstandingJobRequests;
    //var Queue = require('../utils/queue');

    //var jobQueue = new Queue();

    var clusterState = {};

    var jobRequest = {};
    var jobState = {};

    app.use(getData);

    app.get('/getState', function(req, res) {
        res.status(200).send(JSON.stringify(clusterState))
    });

    app.post('/job', function(req, res) {
        //TODO have job validations?

        //io.emit('create slicer', {job: req.body})
        distributeJob(clusterState, io, req.body, res, jobRequest);
    });


    io.on('connection', function(socket) {

        socket.on('node online', function(data) {
            console.log('getting a node connection');
            socket.join(data.id);
            clusterState[data.id] = data;
            //if new node comes online, check if jobs need more workers
        //TODO this only adds one, need to refactor
            outstandingJobRequests(io, jobRequest, data)
        });

        socket.on('job finished', function(jobID) {
            //need to remove any request for additional workers before shutting down workers of completed job
            if(jobRequest[jobID]){
                delete jobRequest[jobID];
            }

            socket.emit('terminate job', jobID);
        });

        socket.on('node state', function(data) {
            clusterState[data.id] = data;
            //if worker became available check if jobs need more workers
            outstandingJobRequests(io, jobRequest, data)
        });


        socket.on('disconnect', function() {
            //TODO handle this
        });

    });

};
