'use strict';
var workerCount = require('os').cpus().length;

module.exports = {
    environment: {
        doc: '',
        default: 'development'
    },
    log_path: {
        doc: '',
        default: '/Users/jarednoble/Desktop/logs'
    },
    workers: {
       doc: 'Number of workers per server',
        default: workerCount
    }

};
