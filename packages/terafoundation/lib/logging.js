'use strict';

var bunyan = require('bunyan');

// Use a temporary logger to bootstrap config
var config = require('./sysconfig')({
    logger: bunyan.createLogger({
        name: "Bootstrap"
    })
});

module.exports = function(name) {
    if (! config) {
        throw "No system configuration. Can not continue.";
    }

    if (! name) name = 'TeraFoundation';

    var log_config = {
        name: name
    }

    var file_stream = {
        level: 'info',
        path: config.log_path + '/' + name + '.log',  // log INFO and above to a file
        type: 'rotating-file',
        period: '1d',   // daily rotation
        count: 3        // keep 3 back copies
    };

    if (config.environment === 'production') {
        log_config.streams = [
            file_stream
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
            { stream: esStream },
            file_stream            
        ];
    }

    var logger = bunyan.createLogger(log_config);

    return logger;
}
