import { cpus } from 'os';

const workerCount = cpus().length;

export = {
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
    asset_storage_connection: {
        doc: 'Name of the S3 connector used to store assets',
        default: undefined,
        format: String
    },
    asset_storage_bucket: {
        doc: 'Name of S3 bucket used to store assets',
        default: undefined,
        format: String
    }
};
