'use strict';

var bunyan = require('bunyan');
var config = require('./sysconfig');

var log_config = { 
    name: 'AgriServer'
}

if (config.environment === 'production') {
    log_config.streams = [        
        {
            level: 'info',
            path: config.api.log  // log ERROR and above to a file
        }
    ]
}
else {
    var Elasticsearch = require('bunyan-elasticsearch');

    var esStream = new Elasticsearch({
      indexPattern: '[logstash-]YYYY.MM.DD',
      type: 'logs',
      host: 'localhost:9200' 
    });
     
    log_config.streams =  [
        { stream: process.stdout },
        { stream: esStream }
    ];
}

var logger = bunyan.createLogger(log_config);

var api = {
    logger: logger
}

module.exports = api;