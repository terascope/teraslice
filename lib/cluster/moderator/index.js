'use strict';

var messageModule = require('./../services/messaging');
var elasticError = require('../../utils/error_utils').elasticError;
var getClient = require('../../utils/config').getClient;


module.exports = function(context){
    var logger = context.foundation.makeLogger('moderator', 'moderator', {module: 'moderator'});

    var messaging = messageModule(context, logger);
    var host = messaging.getHostUrl();

    messaging.register('moderator:cluster:connect', function(){
        logger.info(`moderator has successfully connected to: ${host}`);
       // messaging.send('moderator:online', {hello:'there'})
    });

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);
    messaging.register('worker:shutdown', moderatorShutdown);

    messaging.initialize();

    //replace null wil actual connections config
    var client = getClient(context, null, 'elasticsearch');

    //nodes.stats
    //maybe _cat/nodes to check ram, cpu and heap sizes later

   /* client.cat.threadPool({v:true,h:'active,size,bulk.queue,bulk.queueSize,min,max,queueSize'})
        .then(function(results){
            logger.info(results);
        })
        .catch(function(err){
            logger.error(err)
        });*/

   /* client.cat.threadPool({v:true,h:'active,size,queue,queue_size,min,max,queueSize'})
        .then(function(results){
            logger.info(results);
        })
        .catch(function(err){
            logger.error(err)
        });*/

    client.nodes.stats()
        .then(function(results){
            logger.info(results);
        })
        .catch(function(err){
            logger.error(err)
        });

    
    function moderatorShutdown(){
        logger.warn('moderator is shutting down');
        process.exit();
    }

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

};