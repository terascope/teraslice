import { EventEmitter } from 'node:events';
import { isPlainObject, times, logLevels } from '@terascope/core-utils';
import type { Terafoundation, TerafoundationEnv, Logger } from '@terascope/types';
import { createClient as createDBClient } from '../connector-utils.js';
import { createRootLogger } from './utils.js';
import { PromMetrics } from './prom-metrics/prom-metrics-api.js';

/*
 * This module controls the API endpoints that are exposed under context.apis.
 */
export default function registerApis(
    context: Terafoundation.Context,
    loggerMetadataFields: Record<string, any> = {}
): void {
    const foundationConfig = context.sysconfig.terafoundation;
    const events = new EventEmitter();
    context.logger = createRootLogger(context, loggerMetadataFields);

    // Tracks all child loggers so setLogLevel can update them all.
    // WeakRefs allow GC'd loggers to be collected, and FinalizationRegistry
    // removes their dead references from the Set to prevent unbounded growth.
    type ChildLogger = ReturnType<typeof context.logger.child>;
    const childLoggers = new Set<WeakRef<ChildLogger>>();
    const childLoggerRegistry = new FinalizationRegistry((ref: WeakRef<ChildLogger>) => {
        childLoggers.delete(ref);
        context.logger.debug('child logger GC\'d and pruned from registry');
    });

    // connection cache
    const connections = Object.create(null);

    const foundationApis: Terafoundation.FoundationAPIs = {
        async createClient(options) {
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

                const connection = await createDBClient(
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
        // @ts-expect-error we are doing this for backwards compatibility,
        // though removing it from types will ensure proper code changes when updated
        // need to remove this in the future
        async createClientAsync(options) {
            return this.createClient(options);
        },
        makeLogger(...args: any[]) {
            // If there is already a logger defined we're just creating a
            // child logger using the same config.

            const childLogger = context.logger.child(isPlainObject(args[0])
                ? args[0]
                : args[2]);
            // add flush fn to the new logger
            childLogger.flush = context.logger.flush;

            const childRef = new WeakRef(childLogger);
            childLoggers.add(childRef);
            childLoggerRegistry.register(childLogger, childRef);

            return childLogger;
        },
        /**
         * Sets the log level for the root logger and all registered child loggers simultaneously.
         * Use this instead of setting log levels on individual loggers to ensure consistent
         * log level across the entire application.
         */
        setLogLevel(level: Logger.LogLevel) {
            context.logger.level(level);
            context.logger.info(`root logger level set to ${level}`);
            for (const ref of childLoggers) {
                const logger = ref.deref();
                if (logger) {
                    const name = logger.fields?.module ?? logger.fields?.name ?? '(unnamed)';
                    // converts numeric log level to string so we can use it in our info log
                    const currentLevel = Object.keys(logLevels).find(
                        (key) => logLevels[key as keyof typeof logLevels] === logger.level());
                    logger.level(level);
                    logger.info(`child logger "${name}" log level is set from ${currentLevel} to ${level}`);
                }
            }
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
            } satisfies TerafoundationEnv;

            if (envOptions) {
                Object.assign(env, envOptions);
                env.service_context = JSON.stringify(envOptions);
            }

            const workers: Terafoundation.FoundationWorker[] = [];
            if (cluster.isMaster) {
                context.logger.info(`Starting ${num} ${env.assignment}`);
                times(num, () => {
                    const worker = cluster.fork(env);

                    // for cluster master reference, when a worker dies, you
                    // don't have access to its env at master level
                    Object.assign(worker, env);

                    workers.push(worker);
                });
            }

            return workers;
        },
        promMetrics: new PromMetrics(context.logger)
    };
    function _registerFoundationAPIs() {
        registerAPI('foundation', foundationApis);
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
}
