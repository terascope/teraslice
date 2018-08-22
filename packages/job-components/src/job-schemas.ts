'use strict';

import { Context } from '@terascope/teraslice-types';
import convict from 'convict';
import _ from 'lodash';
import os from 'os';

const cpuCount = os.cpus().length;
const workers = cpuCount < 5 ? cpuCount : 5;

export function jobSchema(context: Context): convict.Schema<any> {
    return {
        analytics: {
            default: true,
            doc: 'logs the time it took in milliseconds for each action, '
                + 'as well as the number of docs it receives',
            format: Boolean,
        },
        assets: {
            default: null,
            doc: 'An array of actions to execute, typically the first is a reader '
                + 'and the last is a sender with any number of processing function in-between',
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
        lifecycle: {
            default: 'once',
            doc: 'Job lifecycle behavior, determines if it should exit on completion or remain active',
            format: ['once', 'persistent'],
        },
        max_retries: {
            default: 3,
            doc: 'the number of times a worker will attempt to process '
                + 'the same slice after a error has occurred',
            format(val: any) {
                if (isNaN(val)) {
                    throw new Error('max_retries parameter for job must be a number');
                } else if (val < 0) {
                    throw new Error('max_retries for job must be >= zero');
                }
            },
        },
        name: {
            default: 'Custom Job',
            doc: 'Name for specific job',
            format(val: any) {
                if (!val) {
                    throw new Error('name for job is required');
                } else if (typeof val !== 'string') {
                    throw new Error(' name for job must be a string');
                }
            },
        },
        operations: {
            default: [],
            doc: 'An array of actions to execute, typically the first is a reader ' +
                'and the last is a sender with '
                + 'any number of processing function in-between',
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
                    if (!op.connection) { return; }

                    if (!_.includes(connections, op.connection)) {
                        throw new Error(`operation ${op._op} refers to an undefined connection`);
                    }
                });
            },
        },
        probation_window: {
            default: 300000,
            doc: 'time in ms that the execution controller checks for failed slices, '
                + 'if there are none then it updates the state of the execution to running '
                + '(this is only when lifecycle is set to persistent)',
            format(val: any) {
                if (isNaN(val)) {
                    throw new Error('probation_window parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('probation_window for job must be >= one');
                }
            },
        },
        recycle_worker: {
            default: null,
            doc: 'The number of slices a worker processes before it exits and restarts',
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
        slicers: {
            default: 1,
            doc: 'how many parallel slicer contexts that will run within the slicer',
            format(val: any) {
                if (isNaN(val)) {
                    throw new Error('slicers parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('slicers for job must be >= one');
                }
            },
        },
        workers: {
            default: workers,
            doc: 'the number of workers dedicated for the job',
            format(val: any) {
                if (isNaN(val)) {
                    throw new Error('workers parameter for job must be a number');
                } else if (val < 1) {
                    throw new Error('workers for job must be >= one');
                }
            },
        },
    };
}

export const opSchema: convict.Schema<any> = {
    _op: {
        default: '',
        doc: 'Name of operation, it must reflect the name of the file',
        format: 'required_String',
    },
};
