'use strict';

var Promise = require('bluebird');
//var makeLogs = require('./storage/logs');
//var messageModule = require('./services/messaging');

module.exports = function(context) {
    var logger = context.foundation.makeLogger('cluster_master', 'cluster_master', {module: 'cluster_master'});
    var clusterConfig = context.sysconfig.teraslice;
    var parseError = require('../utils/error_utils').parseError;
    var event = require('../utils/events');

    // Initialize the HTTP service for handling incoming requests.
   // var app = require('express')();
    console.log(context);
   /* app.post('/assets', function(req, res){
        console.log('hello from', context)
        var results = [];
        req.on('data', function(buff){results.push(buff)});

        req.on('end', function(){
            var data = Buffer.concat(results);
           // assests_service.save(data.toString('base64'))
        });
        res.send('ok')
    });*/
    
   // var server = app.listen(clusterConfig.port);
    logger.info(`cray cray listening on port ${clusterConfig.port}`);

};
