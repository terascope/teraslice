import convict from 'convict';
import { cpus } from 'node:os';

const workerCount = cpus().length;

export function foundationSchema() {
    const schema: convict.Schema<Record<string, any>> = {
        log_path: {
            doc: 'Directory where the logs will be stored if logging is set to `file`',
            default: process.cwd(),
            format: String
        },
        logging: {
            doc: 'Logging destinations. Expects an array of logging targets',
            default: ['console'],
            format(config: unknown): void {
                const values: Record<string, boolean> = { console: true, file: true };
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
                const check: Record<string, boolean> = {
                    trace: true, debug: true, info: true, warn: true, error: true, fatal: true
                };
                if (typeof val === 'string') {
                    if (!check[val]) {
                        throw new Error(`string configuration parameter for log_level is not an accepted value: ${val}`);
                    }
                } else if (Array.isArray(val)) {
                    // expect data formatted like this =>  [{console: 'warn'}, {file: 'info'}]
                    const options: Record<string, boolean> = { console: true, file: true };
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
        prom_metrics_enabled: {
            doc: 'Create prometheus exporters',
            default: false,
            format: Boolean
        },
        prom_metrics_port: {
            doc: 'Port of prometheus exporter server',
            default: 3333,
            format: Number
        },
        prom_metrics_add_default: {
            doc: 'Display default node metrics in prom exporter',
            default: true,
            format: Boolean
        },
        prom_metrics_display_url: {
            doc: 'Value to display as url label for prometheus metrics',
            default: '',
            format: String
        }
    };

    return schema;
}
