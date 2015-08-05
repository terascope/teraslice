'use strict';
var processConfig = require('./utils/config').processConfig;
var getClient = require('./utils/config').getClient;
var Promise = require('bluebird');
var jobs = require('../jobs');

module.exports = function (context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configuration = processConfig(jobs);

    var sourceCode = require(configuration.sourceCode);
    var destinationCode = require(configuration.destinationCode);

    var sourceClient = getClient(configuration.source.system, context);
    var destinationClient = getClient(configuration.destination.system, context);

    //set up listener
    process.on('message', function (msg) {

        if (msg.message === 'data') {
            startSlice(msg.data)
        }
        else {
            if (msg.message === 'ready') {
                process.send({msg: 'finished', id: cluster.worker.id});
            }
            else {
                //setting dirs
                destinationCode.setDirs(msg.data)
            }
        }
    });

    function startSlice(msg) {
        Promise.resolve()
            .then(function () {
                return sourceCode.getData(sourceClient, configuration.source, msg)
            })
            .then(function (data) {
                return destinationCode.processData(data, configuration)
            })
            .then(function (processedData) {
                return destinationCode.sendData(destinationClient, processedData, configuration, msg)
            })
            .then(function (res) {
                //res may return null if no data was received
                if (res && res.errors) {
                    logger.error(res.items)
                }
                else {
                    logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg.start +
                        ' : ' + msg.end);
                    process.send({msg: 'finished', id: cluster.worker.id});
                }
            })
            .catch(function (err) {
                logger.error(err);
                //TODO send msg to master, handle error
            });
    }

};