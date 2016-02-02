'use strict';

//TODO handle instances where http req comes in before node-masters connect
//TODO verify if I can seperate validation code out of initilization of job in config code
//TODO decide shutdown handlers
//TODO need to keep track of jobs and ID's
//TODO need job validations on post to /jobs
//TODO need proper valiadations on cluster sysconfigs



function getData(req, res, next){
    var body = '';

    req.on('data', function(data){
        body += data
    });

    req.on('end', function(){
        req.body = body;
        next();
    })
}

module.exports = function(context){
    var clusterConfig = context.sysconfig.teraslice.cluster;

    var app = require('express')();
    var server = app.listen(clusterConfig.port);
    var io = require('socket.io')(server);


    var clusterState = {};

    app.use(getData);

    app.get('/getState', function(req, res){
        res.status(200).send(JSON.stringify(clusterState))
    });

    app.post('/job', function(req, res){

        //temporary
        io.emit('create slicer', {job: req.body});
        io.emit('create workers', {workers: 3, job: req.body});

        res.send("Job accepted")
    });


    io.on('connection', function(socket){

        socket.on('node online', function(data){
            console.log('getting a node connection');
            socket.join(data.id);
            clusterState[data.id] = data;
        });

        socket.on('job finished', function(job){
            socket.emit('terminate job')
        });

        /*socket.on('ready', function(){
            console.log('i hope this isnt happening');
        })*/

        socket.on('disconnect', function(){

        });

    });

    console.log('in the cluster_master')


};