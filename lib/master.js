'use strict';
var processConfig = require('./utils/config').processConfig;
var getClient = require('./utils/config').getClient;
var Promise = require('bluebird');
var moment = require('moment');

module.exports = function (context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configuration = processConfig(context.sysconfig);

    var source = require(configuration.source);
    var destination = require(configuration.destination);

    var sourceClient = getClient(configuration.sourceSystem, context);
    var destinationClient = getClient(configuration.destinationSystem, context);

    var isDone = false;


    var addListner = function(cb) {
        for (var id in cluster.workers) {
            cluster.workers[id].on('message', cb);
        }
    };

    function sendMessage (id, message) {
        cluster.workers[id].send(message);
    }

//TODO this need to be in utils
    function nextChunk(startTime, endTime ){
        var start = moment(startTime);
        var end = moment(startTime).add(1, 'days');
        var limit = moment(endTime);
        var wasCalled = false;

        return function(){
            if (wasCalled){
                start = start.add(1, 'days');
                end = end.add(1, 'days');
                if (start > limit) {
                    return null;
                }
                return {start: start.format(), end: end.format()};
            }
            else {
                wasCalled = true;
                return {start: start.format(), end: end.format()};
            }
        }
    }
    var next = nextChunk('2015-06-01');


//TODO msg needs index and size from config
    addListner(function(msg){
        //console.log(msg);
        if(msg.msg === 'finished' && !isDone) {
            var data = next();
            if (data === null) {
                sendMessage(msg.id,{isDone: true} )
            }
            else {
                var message = {start: data.start, end: data.end};
                sendMessage(msg.id, message)
            }
        }
    });




};