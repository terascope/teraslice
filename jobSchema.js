'use strict';

var cpuCount = require('os').cpus().length;
var workers = cpuCount < 5 ? cpuCount : 5;

module.exports.jobSchema = {
    name: {
        doc: 'Name for specific job',
        default: 'Custom Job'
    },

    lifecycle: {
        doc: 'Job lifecycle behavior, determines if it should exit on completion or remain active',
        default: 'once'
    },
    interval: {
        doc: 'Specify in tandem with periodic lifecycle',
        default: ''
    },
    analytics: {
        doc: 'logs the time it took in milliseconds for each action, as well as the number of docs it receives',
        default: true
    },
    max_retries: {
        doc: 'the number of times a worker will attempt to process the same slice after a error has occurred',
        default: 3
    },
    workers: {
        doc: 'the number of workers dedicated for the job',
        default: workers
    },
    operations: {
        doc: 'An array of actions to execute, typically the first is a reader and the last is a sender with ' +
        'any number of processing function in-between',
        default:[],
        format: function checkJobProcess(arr){
            console.log('what in the world is this',arr);
            if (!(Array.isArray(arr) && arr.length >= 2)) {
                throw new Error('operations need to be of type array with at least two operations in it')
            }
        }

    }

};

module.exports.commonSchema = {
    _op: {
        doc: 'Name of operation, it must reflect the name of the file',
        default: '',
        format: 'required_String'
    }
};