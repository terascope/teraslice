'use strict';

const cpuCount = require('os').cpus().length;

const workers = cpuCount < 5 ? cpuCount : 5;
const _ = require('lodash');

function jobSchema(context) {
    return {
        name: {
            doc: 'Name for specific job',
            default: 'Custom Job',
            format(val) {
                if (!val) {
                    throw new Error('name for job is required');
                } else if (typeof val !== 'string') {
                    throw new Error(' name for job must be a string');
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
            format(val) {
                if (isNaN(val)) {
                    throw new Error('max_retries parameter for job must be a number');
                } else if (val < 0) {
                    throw new Error('max_retries for job must be >= zero');
                }
            }
        },
        slicers: {
            doc: 'how many parallel slicer contexts that will run within the slicer',
            default: 1,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('slicers parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('slicers for job must be >= one');
                }
            }
        },
        workers: {
            doc: 'the number of workers dedicated for the job',
            default: workers,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('workers parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('workers for job must be >= one');
                }
            }
        },
        operations: {
            doc: 'An array of actions to execute, typically the first is a reader and the last is a sender with '
            + 'any number of processing function in-between',
            default: [],
            format: function checkJobProcess(arr) {
                if (!(Array.isArray(arr) && arr.length >= 2)) {
                    throw new Error('operations need to be of type array with at least two operations in it');
                }
                const connections = _.flatten(_.map(_.values(_.get(context.sysconfig, 'terafoundation.connectors', {})), _.keys));
                arr.forEach((op) => {
                    if (op.connection) {
                        if (!_.includes(connections, op.connection)) {
                            throw new Error(`operation ${op._op} refers to an undefined connection`);
                        }
                    }
                });
            }
        },
        assets: {
            doc: 'An array of actions to execute, typically the first is a reader and the last is a sender with '
            + 'any number of processing function in-between',
            default: null,
            format(arr) {
                if (arr !== null) {
                    if (!(Array.isArray(arr))) {
                        throw new Error('assets need to be of type array');
                    }
                    if (!arr.every(val => typeof val === 'string')) {
                        throw new Error('assets needs to be an array of strings');
                    }
                }
            }
        },
        moderator: {
            doc: 'specify on job if it is to be moderated to not overwhelm their respective databases',
            default: null,
            format(val) {
                if (val) {
                    if (typeof val === 'object') {
                        const configConnectors = _.get(context.sysconfig, 'terafoundation.connectors', {});
                        _.forOwn(val, (config, key) => {
                            if (!configConnectors[key]) {
                                throw new Error(`Moderator specified on job is marked as using ${key}, but it cannot be found in terafoundation.connectors system configuration`);
                            }

                            const connections = Object.keys(configConnectors[key]);
                            const isArray = Array.isArray(config);
                            if (isArray) {
                                const diff = _.difference(config, connections);
                                if (diff.length > 0) {
                                    throw new Error(`Moderator specified on job is marked as using ${key} with connection ${diff}, but the following ${diff} connections were not found`);
                                }
                            } else {
                                throw new Error(`Error in validating moderator, database: ${key} must be set to an array, was given: ${JSON.stringify(config)}`);
                            }
                        });
                    } else {
                        throw new Error('Moderator on the job must be set to an object');
                    }
                }
            }
        },
        recycle_worker: {
            doc: 'The number of slices a worker processes before it exits and restarts',
            default: null,
            format(val) {
                if (val !== null) {
                    if (isNaN(val)) {
                        throw new Error('recycle_worker parameter for job must be a number');
                    } else if (val < 0) {
                        throw new Error('recycle_worker for job must be >= zero');
                    }
                }
            }
        },
        probation_window: {
            doc: 'time in ms that the execution controller checks for failed slices, if there are none then it updates the state of the execution to running (this is only when lifecycle is set to persistent)',
            default: 300000,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('probation_window parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('probation_window for job must be >= one');
                }
            }
        }
    };
}

function commonSchema() {
    return {
        _op: {
            doc: 'Name of operation, it must reflect the name of the file',
            default: '',
            format: 'required_String'
        }
    };
}

module.exports = {
    commonSchema,
    jobSchema
};
