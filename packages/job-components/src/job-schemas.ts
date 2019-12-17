import os from 'os';
import convict from 'convict';
import {
    getField,
    flatten,
    getTypeOf,
    isPlainObject,
    dataEncodings,
    isString,
    DataEncoding
} from '@terascope/utils';
import { Context } from './interfaces';

const cpuCount = os.cpus().length;
const workers = cpuCount < 5 ? cpuCount : 5;

export function jobSchema(context: Context): convict.Schema<any> {
    const schemas: convict.Schema<any> = {
        analytics: {
            default: true,
            doc: [
                'logs the time it took in milliseconds for each action,',
                'as well as the number of docs it receives',
            ].join(' '),
            format: Boolean,
        },
        performance_metrics: {
            default: false,
            doc: 'logs performance metrics, including gc, loop and usage metrics for nodejs',
            format: Boolean,
        },
        assets: {
            default: null,
            doc:
                'An array of actions to execute, typically the first is a reader '
                + 'and the last is a sender with any number of processing function in-between',
            format(arr: any) {
                if (arr != null) {
                    if (!Array.isArray(arr)) {
                        throw new Error('assets need to be of type array');
                    }
                    if (!arr.every(isString)) {
                        throw new Error('assets needs to be an array of strings');
                    }
                }
            },
        },
        autorecover: {
            default: false,
            doc: 'Automatically recover pending slices from the last stopped/completed execution. '
                + 'The last state will always be passed to the slicer',
            format: Boolean,
        },
        lifecycle: {
            default: 'once',
            doc: 'Job lifecycle behavior, determines if it should exit on completion or remain active',
            format: ['once', 'persistent'],
        },
        max_retries: {
            default: 3,
            doc: [
                'the number of times a worker will attempt to process',
                'the same slice after a error has occurred',
            ].join(' '),
            format: 'nat', // integer >=0 (natural number)
        },
        name: {
            default: 'Custom Job',
            doc: 'Name for specific job',
            format: 'required_String',
        },
        operations: {
            default: [],
            doc:
                'An array of actions to execute, typically the first is a reader '
                + 'and the last is a sender with '
                + 'any number of processing function in-between',
            format(arr: any) {
                if (!(Array.isArray(arr) && arr.length >= 2)) {
                    throw new Error('Operations need to be of type array with at least two operations in it');
                }

                const connectorsObject = getField(context.sysconfig.terafoundation, 'connectors', {});
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
            Validated similar to operations, with the exception of no apis are required.
            The _name property is required, and it is required to be unqiue
            but can be suffixed with a identifier by using the format "example:0",
            anything after the ":" is stripped out when searching for the file or folder.`,
            format(arr: any[]) {
                if (!Array.isArray(arr)) {
                    throw new Error('APIs is required to be an array');
                }

                const connectorsObject = getField(context.sysconfig.terafoundation, 'connectors', {});
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
            doc:
                'time in ms that the execution controller checks for failed slices, '
                + 'if there are none then it updates the state of the execution to running '
                + '(this is only when lifecycle is set to persistent)',
            format: 'duration',
        },
        slicers: {
            default: 1,
            doc: 'how many parallel slicer contexts that will run within the slicer',
            format: 'positive_int'
        },
        workers: {
            default: workers,
            doc: 'the number of workers dedicated for the job',
            format: 'positive_int'
        },
        labels: {
            default: null,
            doc: 'An array of arrays containing key value pairs used to label kubetnetes resources.',
            // TODO: Refactor this out as format, copied from env_vars
            format(obj: any[]) {
                if (obj != null) {
                    if (!isPlainObject(obj)) {
                        throw new Error('must be object');
                    }
                    Object.entries(obj).forEach(([key, val]) => {
                        if (key == null || key === '') {
                            throw new Error('key must be not empty');
                        }

                        if (val == null || val === '') {
                            throw new Error(`value for key "${key}" must be not empty`);
                        }
                    });
                }
            },
        },
        env_vars: {
            default: {},
            doc: 'environment variables to set on each the teraslice worker, in the format, { "EXAMPLE": "test" }',
            format(obj: any[]) {
                if (!isPlainObject(obj)) {
                    throw new Error('must be object');
                }
                Object.entries(obj).forEach(([key, val]) => {
                    if (key == null || key === '') {
                        throw new Error('key must be not empty');
                    }

                    if (val == null || val === '') {
                        throw new Error(`value for key "${key}" must be not empty`);
                    }
                });
            },
        }
    };

    const clusteringType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusteringType === 'kubernetes') {
        schemas.targets = {
            default: [],
            doc: 'array of key/value labels used for targetting teraslice jobs to nodes',
            format(arr: any[]) {
                if (!Array.isArray(arr)) {
                    throw new Error('must be array');
                }
                arr.forEach((label) => {
                    if (label.key == null) {
                        throw new Error(`needs to have a key: ${label}`);
                    }

                    if (label.value == null) {
                        throw new Error(`needs to have a value: ${label}`);
                    }
                });
            },
        };

        schemas.cpu = {
            doc: 'number of cpus to reserve per teraslice worker in kubernetes',
            default: undefined,
            format: 'Number',
        };

        schemas.memory = {
            doc: 'memory, in bytes, to reserve per teraslice worker in kubernetes',
            default: undefined,
            format: 'Number',
        };

        schemas.volumes = {
            default: [],
            doc: 'array of volumes to be mounted by job workers',
            format(arr: any[]) {
                if (!Array.isArray(arr)) {
                    throw new Error('must be array');
                }
                arr.forEach((volume) => {
                    if (volume.name == null) {
                        throw new Error(`needs to have a name: ${volume}`);
                    }

                    if (volume.path == null) {
                        throw new Error(`needs to have a path: ${volume}`);
                    }
                });
            },
        };

        schemas.kubernetes_image = {
            doc: 'Specify a custom image name for kubernetes, this only applies to kubernetes systems',
            default: undefined,
            format: 'optional_String',
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
        default: DataEncoding.JSON,
        format: dataEncodings,
    },
    _dead_letter_action: {
        doc: [
            'This action will specify what to do when failing to parse or transform a record.',
            'The following builtin actions are supported:',
            '  - "throw": throw the original error​​',
            '  - "log": log the error and the data​​',
            '  - "none": (default) skip the error entirely',
            'If none of the actions are specified it will try and use a registered Dead Letter Queue API under that name.',
            'The API must be already be created by a operation before it can used.'
        ].join('\n'),
        default: 'none',
        format: 'optional_String',
    },
};

export const apiSchema: convict.Schema<any> = {
    _name: {
        default: '',
        doc: `The _name property is required, and it is required to be unqiue
        but can be suffixed with a identifier by using the format "example:0",
        anything after the ":" is stripped out when searching for the file or folder.`,
        format: 'required_String',
    },
};
