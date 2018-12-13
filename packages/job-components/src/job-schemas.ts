'use strict';

import os from 'os';
import convict from 'convict';
import { Context, dataEncodings } from './interfaces';
import { flatten, getTypeOf, isPlainObject } from './utils';

const cpuCount = os.cpus().length;
const workers = cpuCount < 5 ? cpuCount : 5;

export function jobSchema(context: Context): convict.Schema<any> {
    const schemas: convict.Schema<any> = {
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
                if (arr != null) {
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
            format(arr: any) {
                if (!(Array.isArray(arr) && arr.length >= 2)) {
                    throw new Error('Operations need to be of type array with at least two operations in it');
                }

                const connectorsObject = context.sysconfig.terafoundation && context.sysconfig.terafoundation.connectors || {};
                const connectors = Object.values(connectorsObject);

                const connections = flatten(connectors.map((conn) => Object.keys(conn)));
                for (const op of arr) {
                    if (!op || !isPlainObject(op)) {
                        throw new Error(`Invalid Operation config in operations, got ${getTypeOf(op)}`);
                    }
                    if (op.connection && !connections.includes(op.connection)) {
                        throw new Error(`Operation ${op._op} refers to connection "${op.connection}" which is unavailable`);
                    }
                }
            },
        },
        apis: {
            default: [],
            doc: `An array of apis to load and any configurations they require.
            Validated similar to operations, with the exception of no apis are required and the _name must be unqiue.`,
            format(arr: any[]) {
                if (!Array.isArray(arr)) {
                    throw new Error('APIs is required to be an array');
                }

                const connectorsObject = context.sysconfig.terafoundation && context.sysconfig.terafoundation.connectors || {};
                const connectors = Object.values(connectorsObject);

                const connections = flatten(connectors.map((conn) => Object.keys(conn)));
                const names: string[] = [];

                for (const api of arr) {
                    if (!api || !isPlainObject(api)) {
                        throw new Error(`Invalid API config in apis, got ${getTypeOf(api)}`);
                    }

                    if (!api._name) {
                        throw new Error('API requires an _name');
                    }

                    if (names.includes(api._name)) {
                        throw new Error(`Duplicate API configurations for ${api._name} found`);
                    }

                    names.push(api._name);
                    if (api.connection && !connections.includes(api.connection)) {
                        throw new Error(`API ${api._name} refers to connection "${api.connection}" which is unavailable`);
                    }
                }
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
                if (val != null) {
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

    const clusteringType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusteringType === 'kubernetes') {
        schemas.targets = {
            default: [],
            doc: 'array of key/value labels used for targetting teraslice jobs to nodes',
            format(arr: any[]) {
                arr.forEach((label) => {
                    if (label['key'] == null) {
                        throw new Error(`targets need to have a key: ${label}`);
                    }

                    if (label['value'] == null) {
                        throw new Error(`targets need to have a value: ${label}`);
                    }
                });
            }
        };

        schemas.cpu = {
            doc: 'minimum cpu value for teraslice workers in kubernetes',
            default: -1,
            format: 'Number'
        };

        schemas.memory = {
            doc: 'minimum cpu value for teraslice workers in kubernetes.',
            default: -1,
            format: 'Number'
        };

        schemas.volumes = {
            default: [],
            doc: 'array of volumes to be mounted by job workers',
            format(arr: any[]) {
                arr.forEach((volume) => {
                    if (volume['name'] == null) {
                        throw new Error(`volumes need to have a name: ${volume}`);
                    }

                    if (volume['path'] == null) {
                        throw new Error(`volumes need to have a path: ${volume}`);
                    }
                });
            }
        };
    }

    return schemas;
}

export const makeJobSchema = jobSchema;

export const opSchema: convict.Schema<any> = {
    _op: {
        default: '',
        doc: 'Name of operation, , it must reflect the name of the file or folder',
        format: 'required_String',
    },
    _encoding: {
        doc: 'Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.',
        default: 'json',
        format: dataEncodings,
    },
    _dead_letter_action: {
        doc: `This action will specify what to do when failing to parse or transform a record. ​​​​​
​​​​​The following builtin actions are supported: ​​​
​​​​​  - "throw": throw the original error ​​​​​
​​​​​  - "log": log the error and the data ​​​​​
​​​​​  - "none": (default) skip the error entirely

​​​​​If none of the actions are specified it will try and use a registered Dead Letter Queue API under that name.
The API must be already be created by a operation before it can used.​`.trim(),
        default: 'none',
        format: 'optional_String',
    }
};

export const apiSchema: convict.Schema<any> = {
    _name: {
        default: '',
        doc: 'Name of api, it must reflect the name of the file or folder, and it must unqiue among the other APIs',
        format: 'required_String',
    }
};
