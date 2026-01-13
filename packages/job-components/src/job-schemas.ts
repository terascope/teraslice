import os from 'node:os';
import {
    flatten, getField, getTypeOf,
    hasOwn, isNotNil, isNumber,
    isPlainObject, isString, logLevels,
    dataEncodings
} from '@terascope/core-utils';
import { DataEncoding, Terafoundation } from '@terascope/types';
import { Context } from './interfaces/index.js';

const cpuCount = os.cpus().length;
const workers = cpuCount < 5 ? cpuCount : 5;

/**
 * This schema is for a Teraslice Job definition.
 * @param context Teraslice context object
 * @returns Complete convict style schema for the Teraslice Job
 */
export function jobSchema(context: Context): Terafoundation.Schema<any> {
    const schemas: Terafoundation.Schema<any> = {
        active: {
            default: true,
            doc: 'A convenience property that allows the user to indicate whether the job'
                + ' is in active use.  This is just a marker, Teraslice does not use it.',
            format: Boolean
        },
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
                'An array of strings that are the IDs for the corresponding assets zip files.',
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
            format: 'required_string',
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
                    if (op._connection && !connections.includes(op._connection)) {
                        throw new Error(`Operation ${op._op} refers to connection "${op._connection}" which is unavailable`);
                    }
                }
            },
        },
        apis: {
            default: [],
            doc: `An array of apis to load and any configurations they require.
            Validated similar to operations, with the exception of no apis are required.
            The _name property is required, and it is required to be unique
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
                    // for backwards compatibility for e2e tests, api._connection is correct naming
                    const connectionName = api._connection ? api._connection : api.connection;

                    if (connectionName && !connections.includes(connectionName)) {
                        throw new Error(`API ${api._name} refers to connection "${api._connection}" which is unavailable`);
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
        stateful: {
            default: false,
            doc: 'Indicates that the Teraslice worker maintains internal state, and must be handled differently',
            format: Boolean,
        },
        labels: {
            default: null,
            doc: 'An array of arrays containing key value pairs used to label kubernetes resources.',
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
            format(obj: unknown) {
                if (!isPlainObject(obj)) {
                    throw new Error('must be object');
                }
                Object.entries(obj as Record<string, any>).forEach(([key, val]) => {
                    if (key == null || key === '') {
                        throw new Error('key must be not empty');
                    }

                    if (val == null || val === '') {
                        throw new Error(`value for key "${key}" must be not empty`);
                    }
                });
            },
        },
        log_level: {
            default: null,
            doc: 'the log level to be set on all loggers associated with the job',
            format(level: unknown) {
                if (!level) return;
                const logLevelStrings = Object.keys(logLevels);
                if (typeof level !== 'string' || !logLevelStrings.includes(level)) {
                    throw new Error(`must be one of the following: ${logLevelStrings}`);
                }
            }
        }
    };

    const clusteringType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusteringType === 'kubernetesV2') {
        schemas.targets = {
            default: [],
            doc: 'array of key/value labels used for targeting teraslice jobs to nodes',
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
            doc: 'DEPRECATED: number of cpus to reserve per teraslice worker in kubernetes',
            default: undefined,
            format: 'Number',
        };

        schemas.cpu_execution_controller = {
            doc: 'number of cpus to reserve per teraslice execution controller in kubernetes',
            default: undefined,
            format: 'Number',
        };

        schemas.ephemeral_storage = {
            doc: 'Add ephemeral storage volume to worker and execution controller pods',
            default: false,
            format: Boolean
        };

        schemas.external_ports = {
            doc: 'A numerical array of ports that should be exposed as external ports on the pods',
            default: undefined,
            format(arr: unknown) {
                // TODO: What should we really do to validate this?  It can be
                // omitted, an empty array, or an array with numbers.  It can't
                // contain anything other than numbers.  Processors should be able
                // to have reserved ports.  That is, if a job has port X but a
                // processor requires port X this code should throw an error.
                if (arr != null) {
                    if (!Array.isArray(arr)) {
                        throw new Error('external_ports is required to be an array of numbers or objects like {name: \'myJob\', port: 9000}.');
                    }
                    for (const portValue of arr) {
                        if (isNumber(portValue)) {
                            if (portValue === 45680) {
                                throw new Error('Port 45680 cannot be included in external_ports, it is reserved by Teraslice.');
                            }
                        } else if (isPlainObject(portValue)) {
                            Object.entries(portValue).forEach(([key, val]) => {
                                if (key == null || key === '') {
                                    throw new Error('key must be not empty');
                                }

                                if (val == null || val === '') {
                                    throw new Error(`value for key "${key}" must be not empty`);
                                }
                                if (hasOwn(portValue, 'name') && hasOwn(portValue, 'port')) {
                                    if (!isNumber(portValue.port)) {
                                        throw new Error('The port set on an external_ports object must be a number.');
                                    }
                                    if (portValue.name === '' || !isString(portValue.name)) {
                                        throw new Error('The name set on an external ports object must be a non empty string.');
                                    }
                                } else {
                                    throw new Error('An external_ports entry must be an object like {name: \'myJob\', port: 9000} or a number.');
                                }
                            });
                        } else {
                            throw new Error('An external_ports entry must be a number or an object like {name: \'myJob\', port: 9000}.');
                        }
                    }
                }
            }
        };

        schemas.memory = {
            doc: 'DEPRECATED: memory, in bytes, to reserve per teraslice worker in Kubernetes',
            default: undefined,
            format: 'Number',
        };

        schemas.memory_execution_controller = {
            doc: 'memory, in bytes, to reserve per teraslice execution controller in kubernetes',
            default: undefined,
            format: 'Number',
        };

        schemas.pod_spec_override = {
            doc: 'foo',
            default: {},
            format(obj: Record<string, any>) {
                if (!isPlainObject(obj)) {
                    throw new Error('must be object');
                }
                if ((Object.keys(obj).length !== 0)
                    && (!context.sysconfig.teraslice.kubernetes_overrides_enabled)) {
                    throw new Error('The Teraslice master must set \'kubernetes_overrides_enabled: true\' to use pod_spec_override in a job.');
                }
            }
        };

        schemas.resources_requests_cpu = {
            doc: 'kubernetes CPU request, in cores, to set on Teraslice workers',
            default: undefined,
            format: 'Number'
        };

        schemas.resources_requests_memory = {
            doc: 'kubernetes memory request, in bytes, to set on Teraslice workers',
            default: undefined,
            format: 'Number'
        };

        schemas.resources_limits_cpu = {
            doc: 'kubernetes CPU limit, in cores, to set on Teraslice workers',
            default: undefined,
            format: 'Number'
        };

        schemas.resources_limits_memory = {
            doc: 'kubernetes memory limit, in bytes, to set on Teraslice workers',
            default: undefined,
            format: 'Number'
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
            format: 'optional_string',
        };

        schemas.prom_metrics_enabled = {
            default: undefined,
            doc: 'Create a prometheus exporter. Overrides terafoundation value',
            format: Boolean,
        };

        schemas.prom_metrics_port = {
            doc: 'Port of prometheus exporter server for teraslice process. Overrides terafoundation value',
            default: undefined,
            format: Number
        };

        schemas.prom_metrics_add_default = {
            doc: 'Display default node metrics in prom client. Overrides terafoundation value',
            default: undefined,
            format: Boolean
        };
    }

    return schemas;
}

export const makeJobSchema = jobSchema;

/**
 * This is the schema for a Teraslice Operation.
 */
export const opSchema: Terafoundation.Schema<any> = {
    _op: {
        default: undefined,
        doc: 'Name of operation, , it must reflect the name of the file or folder',
        format: 'required_string',
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
        default: 'throw',
        format: 'optional_string',
    },
};

/**
 * This is the schema for a Teraslice API.
 */
export const apiSchema: Terafoundation.Schema<any> = {
    _name: {
        default: undefined,
        doc: `The _name property is required, and it is required to be unique
        but can be suffixed with a identifier by using the format "example:0",
        anything after the ":" is stripped out when searching for the file or folder.`,
        format: 'required_string',
    },
    _encoding: {
        doc: 'Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.',
        default: undefined,
        format: (val: unknown): void => {
            if (isNotNil(val)) {
                if (isString(val)) {
                    if (!dataEncodings.includes(val as any)) throw new Error(`Invalid parameter _encoding, expected values ${dataEncodings.join(' , ')}, was given ${val}`);
                } else {
                    throw new Error(`Invalid parameter _encoding, expect type string, was given ${getTypeOf(val)}`);
                }
            }
        },
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
        default: 'throw',
        format: 'optional_string',
    },
};
