'use strict';
var processConfig = require('./utils/config').processConfig;
var getClient = require('./utils/config').getClient;
var Promise = require('bluebird');

module.exports = function (context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configuration = processConfig(context.sysconfig);

    var sourceCode = require(configuration.sourceCode);
    var destinationCode = require(configuration.destinationCode);

    var sourceClient = getClient(configuration.source.system, context);
    var destinationClient = getClient(configuration.destination.system, context);


    //set up listener
    process.on('message', function (msg) {
        startSlice(msg)
    });

    //signal to kick off processing
    process.send({msg: 'finished', id: cluster.worker.id});


    function startSlice(msg) {

        Promise.resolve()
            .then(function () {
                return sourceCode.getData(sourceClient, configuration.source, msg)
            })
            .then(function (data) {
                return sourceCode.processData(data, configuration.destination)
            })
            .then(function (processedData) {
                return destinationCode.sendData(destinationClient, processedData)
            })
            .then(function (res) {
                //TODO get range in the logger message
               // console.log(res.errors)
                if ( res && res.errors) {
                    logger.error(res.items)
                } else {
                    logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg.start+
                        ' : '+ msg.end);
                    process.send({msg: 'finished', id: cluster.worker.id});
                }

            })
            .catch(function (err) {
                logger.error(err);
                //TODO send msg to master, handle error
            });
    }

};