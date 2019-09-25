import fs from 'fs';
import path from 'path';
import bunyan from 'bunyan';
import { EventEmitter } from 'events';
import * as ts from '@terascope/utils';
import { createConnection } from '../connector-utils';
import * as i from '../interfaces';

type LogLevelObj = {
    [type in i.LogType]: i.LogLevelType;
};

const useDebugLogger = ts.toBoolean(process.env.USE_DEBUG_LOGGER);

function getLogLevel(level: i.LogLevelConfig): LogLevelObj {
    // Set the same level for all logging types.
    if (typeof level === 'string') {
        return {
            console: level as i.LogLevelType,
            file: level as i.LogLevelType
        };
    }

    // Otherwise there may be a list of separate settins for each type.
    return level.reduce((prev, curr) => {
        Object.assign(prev, curr);
        return prev;
    }, {} as LogLevelObj);
}

/*
 * This module controls the API endpoints that are exposed under context.apis.
 */
export default function apisModule(context: i.FoundationContext) {
    const foundationConfig = context.sysconfig.terafoundation;
    const logLevel = getLogLevel(foundationConfig.log_level);
    const events = new EventEmitter();

    // connection cache
    const connections = Object.create(null);

    const foundationApis: i.FoundationAPIs = {
        getConnection(options) {
            const { type, endpoint = 'default', cached } = options;

            // If it's acceptable to use a cached connection just return instead
            // of creating a new one
            const key = `${type}:${endpoint}`;

            // Location in the configuration where we look for connectors.
            const { connectors } = foundationConfig;

            if (cached && Object.prototype.hasOwnProperty.call(connections, key)) {
                return connections[key];
            }

            if (Object.prototype.hasOwnProperty.call(connectors, type)) {
                context.logger.info(`creating connection for ${type}`);

                let moduleConfig = {};

                if (Object.prototype.hasOwnProperty.call(connectors[type], endpoint)) {
                    moduleConfig = Object.assign(
                        {},
                        foundationConfig.connectors[type][endpoint]
                    );
                    // If an endpoint was specified and doesn't exist we need to error.
                } else if (endpoint) {
                    throw new Error(`No ${type} endpoint configuration found for ${endpoint}`);
                }

                const connection = createConnection(
                    type,
                    moduleConfig,
                    context.logger,
                    options
                );

                if (cached) {
                    connections[key] = connection;
                }

                return connection;
            }

            throw new Error(`No connection configuration found for ${type}`);
        },
        makeLogger(...args: any[]) {
            // If there is already a logger defined we're just creating a
            // child logger using the same config.
            if (context.logger) {
                const childLogger = context.logger.child(ts.isPlainObject(args[0])
                    ? args[0]
                    : args[2]);
                // add flush fn to the new logger
                childLogger.flush = context.logger.flush;

                return childLogger;
            }
            const [name, filename] = args as [string, string];
            if (typeof name !== 'string' || typeof filename !== 'string') {
                throw new Error('Invalid input to makeLogger, expected name and filename');
            }

            if (useDebugLogger) {
                context.logger = ts.debugLogger(`${name}:${filename}`);
                return context.logger;
            }

            const streamConfig: bunyan.Stream[] = [];
            const { environment = 'development' } = foundationConfig;

            // Setup console logging. Always turned on for development but off by
            // default for production.
            if (environment === 'development' || ts.includes(foundationConfig.logging, 'console')) {
                const level = logLevel.console ? logLevel.console : 'info';
                streamConfig.push({ stream: process.stdout, level });
            }

            // Setup logging to files.
            if (ts.includes(foundationConfig.logging, 'file')) {
                const configPath = foundationConfig.log_path || './logs';

                // remove whitespace
                const logfile = filename.trim();

                try {
                // Verify the path is a directory by resolving any symlinks
                    const pathCheck = fs.lstatSync(fs.realpathSync(configPath));
                    if (pathCheck.isDirectory()) {
                        const level = logLevel.file ? logLevel.file : 'info';
                        streamConfig.push({ path: path.join(configPath, `${logfile}.log`), level });
                    } else {
                    // This is error is just caught by the catch block below.
                        throw new Error(`${configPath} is not a directory`);
                    }
                } catch (e) {
                    throw new Error(`Could not write to log_path: ${configPath}`);
                }
            }

            const loggerConfig: bunyan.LoggerOptions = {
                name,
                streams: streamConfig
            };

            context.logger = bunyan.createLogger(loggerConfig) as ts.Logger;
            context.logger.flush = async () => true;

            return context.logger;
        },
        getSystemEvents() {
            return events;
        },
        startWorkers(num: number, envOptions: Record<string, string>) {
            const { cluster } = context;
            // default assignment is set to worker
            // service_context acts as a dictionary to know what env variables
            // are needed on restarts and crashes
            const env = {
                assignment: 'worker',
                service_context: JSON.stringify({ assignment: 'worker' })
            };

            if (envOptions) {
                Object.assign(env, envOptions);
                env.service_context = JSON.stringify(envOptions);
            }

            const workers: i.FoundationWorker[] = [];
            if (cluster.isMaster) {
                context.logger.info(`Starting ${num} ${env.assignment}`);
                ts.times(num, () => {
                    const worker = cluster.fork(env);

                    // for cluster master reference, when a worker dies, you
                    // don't have access to its env at master level
                    Object.assign(worker, env);

                    workers.push(worker);
                });
            }

            return workers;
        }
    };
    function _registerFoundationAPIs() {
        registerAPI('foundation', foundationApis);
    }

    // Accessing these APIs directly under context.foundation is deprecated.
    function _registerLegacyAPIs() {
        const { getSystemEvents, ...legacyApis } = foundationApis;
        context.foundation = {
            ...legacyApis,
            getEventEmitter: getSystemEvents,
        };
    }

    /*
     * Used by modules to register API endpoints that can be used elsewhere
     * in the system.
     * @param {string} name - The module name being registered
     * @param {string} api - Object containing the functions being exposed as the API
     */
    function registerAPI(name: string, api: any) {
        if (Object.prototype.hasOwnProperty.call(context.apis, name)) {
            throw new Error(`Registration of API endpoints for module ${name} can only occur once`);
        } else {
            context.apis[name] = api;
        }
    }

    // This exposes the registerAPI function to the rest of the system.
    context.apis = {
        registerAPI
    } as any;

    _registerFoundationAPIs();
    _registerLegacyAPIs();

    return context.apis;
}
