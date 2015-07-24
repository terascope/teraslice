'use strict';
var processConfig = require('./utils/config').processConfig;
var getClient = require('./utils/config').getClient;
var Promise = require('bluebird');

module.exports = function(context){
    var cluster = context.cluster;
    var logger = context.logger;
    var configuration = processConfig(context.sysconfig);

    var source = require(configuration.source);
    var destination = require(configuration.destination);

    var sourceClient = getClient(configuration.sourceSystem, context);
    var destinationClient = getClient(configuration.destinationSystem, context);

   // console.log('from the child',cluster, process.pid)

    //set up listener
 process.on('message', function(msg){
     if (msg.isDone) {
         process.exit()
     }
     else {
         startSlice(msg)
     }
 });

    //ready to start processing
    process.send({msg: 'finished', id: cluster.worker.id});

   function startSlice(msg) {

       Promise.resolve()
           .then(function () {
               return source.getData(sourceClient, {index: ['events-*'],
                   size: 100,
                   body:{

               }})
           })
           .then(function (data) {
               return source.processData(data, {index: 'testing5', type: 'events'})
           })
           .then(function (data) {
               return destination.sendData(destinationClient, data)
           })
           .then(function (res) {
               //TODO send message to master if failed or completed
               console.log(res.took, res.errors, res.items.length);
               console.log('we are done, we can exit now')
           })
           .catch(function (err) {
               console.log('we got an error', err);
               //TODO send msg to master
           });
   }

};