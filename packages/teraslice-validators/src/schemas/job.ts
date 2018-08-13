'use strict';

import * as Convict from 'convict';
import { Context } from '@terascope/teraslice-types';
import * as os from 'os';
import * as _ from 'lodash';

const cpuCount = os.cpus().length;
const workers = cpuCount < 5 ? cpuCount : 5;

export function jobSchema(context: Context): Convict.Schema<any> {
    return {
        name: {
            doc: 'Name for specific job',
            default: 'Custom Job',
            format(val: any) {
                if (!val) {
                    throw new Error('name for job is required');
                } else if (typeof val !== 'string') {
                    throw new Error(' name for job must be a string');
                }
            },
        },
        lifecycle: {
            doc: 'Job lifecycle behavior, determines if it should exit '
            + 'on completion or remain active',
            default: 'once',
            format: ['once', 'persistent'],
        },
        analytics: {
            doc: 'logs the time it took in milliseconds for each action, '
            + 'as well as the number of docs it receives',
            default: true,
            format: Boolean,
        },
        max_retries: {
            doc: 'the number of times a worker will attempt to process '
            + 'the same slice after a error has occurred',
            default: 3,
            format(val: any) {
                if (isNaN(val)) {
                    throw new Error('max_retries parameter for job must be a number');
                } else if (val < 0) {
                    throw new Error('max_retries for job must be >= zero');
                }
            },
        },
        slicers: {
            doc: 'how many parallel slicer contexts that will run within the slicer',
            default: 1,
            format(val: any) {
                if (isNaN(val)) {
                    throw new Error('slicers parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('slicers for job must be >= one');
                }
            },
        },
        workers: {
            doc: 'the number of workers dedicated for the job',
            default: workers,
            format(val: any) {
                if (isNaN(val)) {
                    throw new Error('workers parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('workers for job must be >= one');
                }
            },
        },
        operations: {
            doc: 'An array of actions to execute, typically the first is a reader ' +
            'and the last is a sender with '
                + 'any number of processing function in-between',
            default: [],
            format: function checkJobProcess(arr: any) {
                if (!(Array.isArray(arr) && arr.length >= 2)) {
                    throw new Error('operations need to be of type array ' +
                        'with at least two operations in it');
                }

                const connectors = _.values(
                    _.get(context.sysconfig, 'terafoundation.connectors', {}),
                );

                const connections = _.flatten(_.map(connectors, _.keys));
                arr.forEach((op) => {
                    if (!op.connection) return;

                    if (!_.includes(connections, op.connection)) {
                        throw new Error(`operation ${op._op} refers to an undefined connection`);
                    }
                });
            },
        },
        assets: {
            doc: 'An array of actions to execute, typically the first is a reader '
                + 'and the last is a sender with any number of processing function in-between',
            default: null,
            format(arr: any) {
                if (arr !== null) {
                    if (!(Array.isArray(arr))) {
                        throw new Error('assets need to be of type array');
                    }
                    if (!arr.every(val => typeof val === 'string')) {
                        throw new Error('assets needs to be an array of strings');
                    }
                }
            },
        },
        recycle_worker: {
            doc: 'The number of slices a worker processes before it exits and restarts',
            default: null,
            format(val: any) {
                if (val !== null) {
                    if (isNaN(val)) {
                        throw new Error('recycle_worker parameter for job must be a number');
                    } else if (val < 0) {
                        throw new Error('recycle_worker for job must be >= zero');
                    }
                }
            },
        },
        probation_window: {
            doc: 'time in ms that the execution controller checks for failed slices, '
            + 'if there are none then it updates the state of the execution to running '
            + '(this is only when lifecycle is set to persistent)',
            default: 300000,
            format(val: any) {
                if (isNaN(val)) {
                    throw new Error('probation_window parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('probation_window for job must be >= one');
                }
            },
        },
    };
}

export function commonSchema() : object {
    return {
        _op: {
            doc: 'Name of operation, it must reflect the name of the file',
            default: '',
            format: 'required_String',
        },
    };
}
