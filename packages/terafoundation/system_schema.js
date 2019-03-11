'use strict';

const workerCount = require('os').cpus().length;

const dirPath = process.cwd();

module.exports = {
    environment: {
        doc: 'If set to `production`, console logging will be disabled and logs will be sent to a file',
        default: 'development'
    },
    log_path: {
        doc: 'Directory where the logs will be stored if logging is set to `file`',
        default: dirPath,
        format: String
    },
    logging: {
        doc: 'Logging destinations. Expects an array of logging targets. options: console, file, elasticsearch',
        default: ['console'],
        format(config) {
            const values = { console: true, file: true, elasticsearch: true };
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
        format(val) {
            const check = {
                trace: true, debug: true, info: true, warn: true, error: true, fatal: true
            };
            if (typeof val === 'string') {
                if (!check[val]) {
                    throw new Error(`string configuration parameter for log_level is not an accepted value: ${val}`);
                }
            } else if (Array.isArray(val)) {
                // expect data formatted like this =>  [{console: 'warn'}, {file: 'info'}]
                const options = { console: true, file: true, elasticsearch: true };
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
    log_buffer_limit: {
        doc: 'Number of log lines to buffer before sending to elasticsearch, logging must have elasticsearch set as a value for this to take effect',
        default: 30,
        format(val) {
            if (isNaN(val)) {
                throw new Error('log_buffer_limit parameter for terafoundation must be a number');
            } else if (val <= 10) {
                // the buffer needs to be large enough to keep all logs before the client
                // is instantiated. An error will throw if the buffer limit is reached before
                // client is provided
                throw new Error('log_buffer_limit parameter for terafoundation must be greater than 10');
            }
        }
    },
    log_buffer_interval: {
        doc: 'How often the log buffer will flush the logs (number in milliseconds)',
        default: 60000,
        format(val) {
            if (isNaN(val)) {
                throw new Error('log_buffer_interval parameter for terafoundation must be a number');
            } else if (val <= 1000) {
                throw new Error('log_buffer_interval parameter for terafoundation must be greater than a 1000 ms');
            }
        }
    },
    log_index_rollover_frequency: {
        doc: 'How frequently the log indices are created',
        default: 'monthly',
        format: ['daily', 'monthly', 'yearly']
    },
    log_connection: {
        doc: 'logging connection endpoint if logging is saved to elasticsearch',
        default: 'default'
    },
    workers: {
        doc: 'Number of workers per server',
        default: workerCount
    }
};
