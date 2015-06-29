'use strict';
var bunyan = require('bunyan');
var fs = require('fs');

module.exports = function(context) {
    var name = context.name;
    var config = context.sysconfig;
    var cluster = context.cluster;
    var stats;

    if (! config) {
        throw "No system configuration. Can not continue.";
    }

    if (! name) name = 'TeraFoundation';

    var log_config = {
        name: name
    };

    var configPath = config.log_path ? config.log_path : './logs';

    var worker_id = '0'; // Use worker_id 0 for the master
    if (cluster.isWorker) worker_id = cluster.worker.id;

    var file_stream = {
        level: 'info',
        path: configPath + '/' + name + '-' + worker_id + '.log',  // log INFO and above to a file
        type: 'rotating-file',
        period: '1d',   // daily rotation
        count: 7        // keep 7 days history
    };

    if (config.environment === 'production') {
        try {
            // See if path exists
            stats = fs.lstatSync(configPath);

            if (stats.isDirectory()) {
                console.log('Process ' + worker_id + ' starting. Logs being written to '+ configPath + '/' + name + '.log ')
            }
        }
        catch (e) {
            throw "No valid log_path is specified"
        }

        log_config.streams = [
            file_stream
        ]
    }
    else {
        /*var Elasticsearch = require('bunyan-elasticsearch');

        var esStream = new Elasticsearch({
          indexPattern: '[logstash-]YYYY.MM.DD',
          type: 'logs',
          host: 'localhost:9200'
        });

        log_config.streams =  [
            { stream: process.stdout },
            { stream: esStream },
            file_stream            
        ];*/
    }

    var logger = bunyan.createLogger(log_config);

    return logger;
};
