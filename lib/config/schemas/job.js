'use strict';

var cpuCount = require('os').cpus().length;
var workers = cpuCount < 5 ? cpuCount : 5;
var _ = require('lodash');

function jobSchema(context) {
    return {
        name: {
            doc: 'Name for specific job',
            default: 'Custom Job',
            format: function(val) {
                if (!val) {
                    throw new Error('name for job is required')
                }
                else {
                    if (typeof val !== 'string') {
                        throw new Error(' name for job must be a string')
                    }
                }
            }
        },
        lifecycle: {
            doc: 'Job lifecycle behavior, determines if it should exit on completion or remain active',
            default: 'once',
            format: ['once', 'persistent']
        },
        analytics: {
            doc: 'logs the time it took in milliseconds for each action, as well as the number of docs it receives',
            default: true,
            format: Boolean
        },
        max_retries: {
            doc: 'the number of times a worker will attempt to process the same slice after a error has occurred',
            default: 3,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('max_retries parameter for job must be a number')
                }
                else {
                    if (val < 0) {
                        throw new Error('max_retries for job must be >= zero')
                    }
                }
            }
        },
        slicers: {
            doc: 'how many parallel slicer contexts that will run within the slicer',
            default: 1,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('slicers parameter for job must be a number')
                }
                else {
                    if (val < 1) {
                        throw new Error('slicers for job must be >= one')
                    }
                }
            }
        },
        workers: {
            doc: 'the number of workers dedicated for the job',
            default: workers,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('workers parameter for job must be a number')
                }
                else {
                    if (val < 1) {
                        throw new Error('workers for job must be >= one')
                    }
                }
            }
        },
        operations: {
            doc: 'An array of actions to execute, typically the first is a reader and the last is a sender with ' +
            'any number of processing function in-between',
            default: [],
            format: function checkJobProcess(arr) {
                if (!(Array.isArray(arr) && arr.length >= 2)) {
                    throw new Error('operations need to be of type array with at least two operations in it')
                }
            }
        },
        assets: {
            doc: 'An array of actions to execute, typically the first is a reader and the last is a sender with ' +
            'any number of processing function in-between',
            default: null,
            format: function(arr) {
                if (arr !== null) {
                    if (!(Array.isArray(arr))) {
                        throw new Error('assets need to be of type array')
                    }
                    if (!arr.every(val => typeof val === 'string')) {
                        throw new Error('assets needs to be an array of strings')
                    }
                }
            }
        },
        moderator: {
            doc: 'specify on job if it is to be moderated to not overwhelm their respective databases',
            default: null,
            format: function(val) {
                if (val) {
                    if (typeof val === 'object') {
                        let configConnectors = context.sysconfig.terafoundation.connectors;
                        _.forOwn(val, function(config, key) {
                            if (!configConnectors[key]) {
                                throw new Error(`Moderator specified on job is marked as using ${key}, but it cannot be found in terafoundation.connectors system configuration`)
                            }

                            var connections = Object.keys(configConnectors[key]);
                            var isArray = Array.isArray(config);
                            var isString = typeof config === 'string';

                            if (isString || isArray) {
                                if (isString) {
                                    var isFound = connections.find(type => type === config);
                                    if (!isFound) {
                                        throw new Error(`Moderator specified on job is marked as using ${key} with connection ${config}, but no ${config} connection was found`)
                                    }
                                }
                                else {
                                    var diff = _.difference(config, connections);
                                    if (diff.length > 0) {
                                        throw new Error(`Moderator specified on job is marked as using ${key} with connection ${diff}, but the following ${diff} connections were not found`)
                                    }
                                }
                            }
                            else {
                                throw new Error(`Error in validating moderator, `)
                            }

                        })
                    }
                    else {
                        throw new Error('Moderator on the job must be set to an object')
                    }
                }
            }
        }
    }
}

function commonSchema() {
    return {
        _op: {
            doc: 'Name of operation, it must reflect the name of the file',
            default: '',
            format: 'required_String'
        }
    }
}

module.exports = {
    commonSchema: commonSchema,
    jobSchema: jobSchema
};