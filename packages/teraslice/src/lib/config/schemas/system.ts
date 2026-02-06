import ip from 'ip';
import path from 'node:path';
import { Terafoundation, Teraslice } from '@terascope/types';
import {
    isPlainObject, isString, isArray,
    isInteger
} from '@terascope/core-utils';
import { cpus } from 'node:os';

const workerCount = cpus().length;
const DEFAULT_ASSET_STORAGE_CONNECTION_TYPE = 'elasticsearch-next';

/**
 * This schema object is for the Teraslice configuration settings coming from
 * its configuration file.
 */
export const schema = {
    api_response_timeout: {
        doc: 'HTTP response timeout for the Teraslice API server',
        default: '5 minutes',
        format: 'duration'
    },
    assets_directory: {
        doc: 'directory to look for assets',
        default: path.join(process.cwd(), './assets'),
        format: (val: string | string[]) => {
            if (val) {
                if (isArray(val)) {
                    const containStrings = val.every(isString);
                    if (!containStrings) throw new Error('Invalid parameter assets_directory, if specified as an array, it must contain an array of strings');
                    return;
                }
                if (!isString(val)) throw new Error('Invalid parameter assets_directory, it must either be a string or an array of strings');
            }
        }
    },
    assets_volume: {
        doc: 'name of shared asset volume (k8s)',
        default: undefined,
        format: 'optional_string'
    },
    autoload_directory: {
        doc: 'directory to look for assets to auto deploy when teraslice boots up',
        default: path.join(process.cwd(), './autoload'),
        format: 'optional_string'
    },
    hostname: {
        doc: 'IP or hostname for server',
        default: ip.address(),
        format: 'required_string'
    },
    workers: {
        doc: 'Number of workers per server',
        default: workerCount,
        format: 'nat'
    },
    master: {
        doc: 'boolean for determining if cluster_master should live on this node',
        default: false,
        format: Boolean
    },
    master_hostname: {
        doc:
            'hostname where the cluster_master resides, used to notify all node_masters where to connect',
        default: 'localhost',
        format: 'required_string'
    },
    port: {
        doc: 'port for the cluster_master to listen on',
        default: 5678,
        format: 'port'
    },
    name: {
        doc: 'Name for the cluster itself, its used for naming log files/indices',
        default: 'teracluster',
        format: 'elasticsearch_name'
    },
    state: {
        doc: 'Opensearch cluster where job state, analytics and logs are stored',
        default: { connection: 'default' },
        format(val: Record<string, any>) {
            if (!val.connection) {
                throw new Error('state parameter must be an object with a key named "connection"');
            }
            if (typeof val.connection !== 'string') {
                throw new Error(
                    'state parameter object with a key "connection" must be of type String as the value'
                );
            }
        }
    },
    index_settings: {
        analytics: {
            number_of_shards: {
                doc: 'The number of shards for the analytics index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the analytics index',
                default: 1
            }
        },
        assets: {
            number_of_shards: {
                doc: 'The number of shards for the assets index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the assets index',
                default: 1
            }
        },
        jobs: {
            number_of_shards: {
                doc: 'The number of shards for the jobs index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the jobs index',
                default: 1
            }
        },
        execution: {
            number_of_shards: {
                doc: 'The number of shards for the execution index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the execution index',
                default: 1
            }
        },
        state: {
            number_of_shards: {
                doc: 'The number of shards for the state index',
                default: 5
            },
            number_of_replicas: {
                doc: 'The number of replicas for the state index',
                default: 1
            }
        }
    },
    shutdown_timeout: {
        doc:
            'time in milliseconds for workers and slicers to finish operations before forcefully shutting down',
        default: '1 minute',
        format: 'duration'
    },
    node_disconnect_timeout: {
        doc:
            'time in milliseconds that the cluster will wait until it drops that node from state and attempts to provision the lost workers',
        default: '5 minutes',
        format: 'duration'
    },
    worker_disconnect_timeout: {
        doc:
            'time in milliseconds that the slicer will wait after all workers have disconnected before terminating the job',
        default: '5 minutes',
        format: 'duration'
    },
    slicer_timeout: {
        doc:
            'time in milliseconds that the slicer will wait for worker connection before terminating the job',
        default: '3 minutes',
        format: 'duration'
    },
    action_timeout: {
        doc:
            'time in milliseconds for waiting for a network message (pause/stop job, etc) to complete before throwing an error',
        default: '2 minutes',
        format: 'duration'
    },
    network_latency_buffer: {
        doc:
            'time in milliseconds buffer which is combined with action_timeout to determine how long a network message will wait till it throws an error',
        default: '15 seconds',
        format: 'duration'
    },
    node_state_interval: {
        doc:
            'time in milliseconds that indicates when the cluster master will ping nodes for their state',
        default: '5 seconds',
        format: 'duration'
    },
    analytics_rate: {
        doc: 'time in milliseconds in which to push analytics to cluster master',
        default: '1 minute',
        format: 'duration'
    },
    slicer_allocation_attempts: {
        doc: 'The number of times a slicer will try to be allocated before failing',
        default: 3,
        format: 'nat', // integer >=0 (natural number)
    },
    slicer_port_range: {
        doc: 'range of ports that slicers will use per node',
        default: '45679:46678',
        format(val: string) {
            const arr = val.split(':');
            if (arr.length !== 2) {
                throw new Error('slicer_port_range is formatted incorrectly');
            }
            arr.forEach((value) => {
                if (isInteger(value) !== false) {
                    throw new Error(
                        'values specified in slicer_port_range must be a number specified as a string'
                    );
                }
            });
        }
    },
    index_rollover_frequency: {
        state: {
            doc: 'How frequently the teraslice state indices are created',
            default: 'monthly',
            format: ['daily', 'monthly', 'yearly']
        },
        analytics: {
            doc: 'How frequently the analytics indices are created',
            default: 'monthly',
            format: ['daily', 'monthly', 'yearly']
        }
    },
    cluster_manager_type: {
        doc: 'determines which cluster system should be used',
        default: 'native',
        format: ['native', 'kubernetesV2']
    },
    cpu: {
        doc: 'number of cpus to reserve per teraslice worker in kubernetes',
        default: undefined,
        format: 'Number'
    },
    cpu_execution_controller: {
        doc: 'number of cpus to reserve per teraslice execution controller in kubernetes',
        default: 0.5,
        format: 'Number'
    },
    ephemeral_storage: {
        doc: 'Add ephemeral storage volume to worker and execution controller pods',
        default: false,
        format: Boolean
    },
    memory: {
        doc: 'memory, in bytes, to reserve per teraslice worker in kubernetes',
        default: undefined,
        format: 'Number'
    },
    memory_execution_controller: {
        doc: 'memory, in bytes, to reserve per teraslice execution controller in kubernetes',
        default: 512000000,
        format: 'Number'
    },
    env_vars: {
        default: {},
        doc: 'default environment variables to set on each the teraslice worker, in the format, { "EXAMPLE": "test" }',
        format(obj: Record<string, any>) {
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
    },
    execution_controller_targets: {
        default: null,
        doc: 'Specify an array of {"key": ..., "value": ...} targets for execution controllers',
        format(arr: any[] | undefined) {
            if (arr != null) {
                if (!Array.isArray(arr)) {
                    throw new Error('labels is required to be an array');
                    // FIXME: improve input and error handling
                }
            }
        }
    },
    kubernetes_api_poll_delay: {
        doc: 'Specify the delay between attempts to poll the kubernetes API',
        default: '1 second',
        format: 'duration'
    },
    kubernetes_image: {
        doc: 'Specify a custom image name for kubernetes, this only applies to kubernetes systems',
        default: 'terascope/teraslice',
        format: 'optional_string'
    },
    kubernetes_namespace: {
        doc: 'Specify a custom kubernetes namespace, this only applies to kubernetes systems',
        default: 'default',
        format: 'optional_string'
    },
    kubernetes_overrides_enabled: {
        doc: '',
        default: false,
        format: Boolean
    },
    kubernetes_priority_class_name: {
        doc: 'Priority class that the Teraslice master, execution controller, and stateful workers should run with',
        default: undefined,
        format: 'optional_string'
    },
    kubernetes_config_map_name: {
        doc: 'Specify the name of the Kubernetes ConfigMap used to configure worker pods',
        default: 'teraslice-worker',
        format: 'optional_string'
    },
    kubernetes_image_pull_secret: {
        doc: 'Name of Kubernetes secret used to pull docker images from private repository',
        default: undefined,
        format: 'optional_string'
    },
    kubernetes_worker_antiaffinity: {
        doc: 'Enable Teraslice woker pod AntiAffinity in Kubernetes',
        default: false,
        format: Boolean
    },
    asset_storage_connection_type: {
        doc: 'Name of the connection type used to store assets',
        default: DEFAULT_ASSET_STORAGE_CONNECTION_TYPE,
        format: String
    },
    asset_storage_connection: {
        doc: 'Name of the connection used to store assets.',
        default: 'default',
        format: String
    },
    asset_storage_bucket: {
        doc: 'Name of S3 bucket used to store assets. Can only be used if "asset_storage_connection_type" is "s3".',
        default: undefined,
        format: 'optional_string'
    },
};

export function configSchema() {
    return {
        schema: { teraslice: schema },
        validatorFn: (
            config: Teraslice.Config,
            sysconfig: Terafoundation.SysConfig<Teraslice.Config>
        ) => {
            const connectionType = config.asset_storage_connection_type
                || DEFAULT_ASSET_STORAGE_CONNECTION_TYPE;
            const connectionTypesPresent = Object.keys(sysconfig.terafoundation.connectors);
            const validConnectionTypes = ['elasticsearch-next', 's3'];

            // checks on asset_storage_connection_type
            if (!validConnectionTypes
                .includes(connectionType)) {
                throw new Error(`Invalid asset_storage_connection_type. Valid types: ${validConnectionTypes.toString()}`);
            }

            if (!connectionTypesPresent
                .includes(connectionType)) {
                throw new Error('asset_storage_connection_type not found in terafoundation.connectors');
            }

            // checks on asset_storage_connection
            const connectionsPresent = Object.keys(sysconfig.terafoundation.connectors[`${connectionType}`]);
            /// Check to make sure the asset_storage_connection exists inside the connector
            /// Exclude elasticsearch as this connection type does not utilize this value
            if (
                connectionType !== 'elasticsearch-next'
                && config.asset_storage_connection
                && !connectionsPresent.includes(config.asset_storage_connection)
            ) {
                throw new Error(`${config.asset_storage_connection} not found in terafoundation.connectors.${connectionType}`);
            }

            // checks on asset_storage_bucket
            if (config.asset_storage_bucket && connectionType !== 's3') {
                throw new Error('asset_storage_bucket can only be used if asset_storage_connection_type is set to "s3"');
            }
            // TODO: add regex to check if valid bucket name
        }
    };
}

// TODO: fix this
export const config_schema = configSchema;
