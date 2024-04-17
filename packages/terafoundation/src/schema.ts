import convict from 'convict';
import { cpus } from 'os';
import { Terafoundation } from '@terascope/types';

const workerCount = cpus().length;
const DEFAULT_ASSET_STORAGE_CONNECTION_TYPE = 'elasticsearch-next';

export function foundationSchema() {
    const schema: convict.Schema<Record<string, any>> = {
        environment: {
            doc: 'If set to `production`, console logging will be disabled and logs will be sent to a file',
            default: 'development',
            env: 'NODE_ENV'
        },
        log_path: {
            doc: 'Directory where the logs will be stored if logging is set to `file`',
            default: process.cwd(),
            format: String
        },
        logging: {
            doc: 'Logging destinations. Expects an array of logging targets',
            default: ['console'],
            format(config: unknown): void {
                const values = { console: true, file: true };
                if (!Array.isArray(config)) {
                    throw new Error('value for logging set in terafoundation must be an array');
                }

                config.forEach((type) => {
                    if (!values[type]) {
                        throw new Error(`value: ${type} is not a valid configuration for logging`);
                    }
                });
            }
        },
        log_level: {
            doc: 'Default logging levels',
            default: 'info',
            format(val: unknown): void {
                const check = {
                    trace: true, debug: true, info: true, warn: true, error: true, fatal: true
                };
                if (typeof val === 'string') {
                    if (!check[val]) {
                        throw new Error(`string configuration parameter for log_level is not an accepted value: ${val}`);
                    }
                } else if (Array.isArray(val)) {
                    // expect data formatted like this =>  [{console: 'warn'}, {file: 'info'}]
                    const options = { console: true, file: true };
                    const incorrectKeys = val.reduce((prev, curr) => {
                        Object.keys(curr).forEach((key) => {
                            if (!options[key]) {
                                prev.push(curr);
                            }
                            if (!check[curr[key]]) {
                                prev.push(curr);
                            }
                        });
                        return prev;
                    }, []);

                    if (incorrectKeys.length > 0) {
                        throw new Error('array configuration parameter for log_level are not configured correctly');
                    }
                } else {
                    throw new Error('configuration parameter for log_level can either be a string or an array, please check the documentation');
                }
            }
        },
        workers: {
            doc: 'Number of workers per server',
            default: workerCount
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
            format: String
        },
        prom_metrics_main_port: {
            doc: 'Port of promethius exporter server for teraslice process',
            default: 3333,
            format: Number
        },

        prom_metrics_assets_port: {
            doc: 'Port of promethius exporter server for assets_service process',
            default: 3334,
            format: Number
        },
        prom_default_metrics: {
            doc: 'If true prom client will display default node metrics',
            default: true,
            format: Boolean
        }
    };

    return schema;
}

export function foundationValidatorFn<S>(
    subconfig: Record<string, any>,
    _sysconfig: Terafoundation.SysConfig<S>
): void {
    const typedSubconfig = subconfig as Terafoundation.Foundation;
    const connectionType = typedSubconfig.asset_storage_connection_type
        || DEFAULT_ASSET_STORAGE_CONNECTION_TYPE;
    const connectionTypesPresent = Object.keys(typedSubconfig.connectors);
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
    const connectionsPresent = Object.keys(typedSubconfig.connectors[`${connectionType}`]);
    /// Check to make sure the asset_storage_connection exists inside the connector
    /// Exclude elasticsearch as this connection type does not utilize this value
    if (
        connectionType !== 'elasticsearch-next'
        && typedSubconfig.asset_storage_connection
        && !connectionsPresent.includes(typedSubconfig.asset_storage_connection)
    ) {
        throw new Error(`${typedSubconfig.asset_storage_connection} not found in terafoundation.connectors.${connectionType}`);
    }

    // checks on asset_storage_bucket
    if (typedSubconfig.asset_storage_bucket && connectionType !== 's3') {
        throw new Error('asset_storage_bucket can only be used if asset_storage_connection_type is set to "s3"');
    }
    // TODO: add regex to check if valid bucket name
}
