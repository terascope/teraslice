import { EventEmitter } from 'events';
import * as ts from '@terascope/utils';
import { createConnection, createClient as createDBClient } from '../connector-utils';
import { createRootLogger } from './utils';
import * as i from '../interfaces';
import { PromMetrics } from '../prom-metrics/prom-metrics-api';

/*
 * This module controls the API endpoints that are exposed under context.apis.
 */
export default function registerApis(context: i.FoundationContext): void {
    const foundationConfig = context.sysconfig.terafoundation;
    const events = new EventEmitter();
    context.logger = createRootLogger(context);

    let promMetrics: PromMetrics;

    // connection cache
    const connections = Object.create(null);

    const foundationApis: i.FoundationAPIs = {
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

            const childLogger = context.logger.child(ts.isPlainObject(args[0])
                ? args[0]
                : args[2]);
            // add flush fn to the new logger
            childLogger.flush = context.logger.flush;

            return childLogger;
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
        },
        async createPromMetricsAPI(
            callingContext: i.FoundationContext,
            apiConfig: i.PromMetricsAPIConfig,
            logger: ts.Logger,
            labels?: Record<string, string>
        ) {
            if (!promMetrics) {
                promMetrics = new PromMetrics(callingContext, apiConfig, logger, labels);
                await promMetrics.createAPI();
            } else {
                context.logger.warn('Cannot create PromMetricsAPI because it already exists.');
            }
        },
        promMetrics: {
            set(name: string, labels: Record<string, string>, value: number):void {
                promMetrics.set(name, labels, value);
            },
            inc(name: string, labelValues: Record<string, string>, value: number): void {
                promMetrics.inc(name, labelValues, value);
            },
            dec(name: string, labelValues: Record<string, string>, value: number): void {
                promMetrics.dec(name, labelValues, value);
            },
            observe(name: string, labelValues: Record<string, string>, value: number): void {
                promMetrics.observe(name, labelValues, value);
            },
            async addMetric(
                name: string,
                help: string,
                labelNames: Array<string>,
                type: 'gauge' | 'counter' | 'histogram',
                buckets?: Array<number>
            ): Promise<void> {
                promMetrics.addMetric(name, help, labelNames, type, buckets);
            },
            addSummary(
                name: string,
                help: string,
                labelNames: Array<string>,
                ageBuckets: number,
                maxAgeSeconds: number,
                percentiles: Array<number>
            ): void {
                promMetrics.addSummary(name,
                    help,
                    labelNames,
                    ageBuckets,
                    maxAgeSeconds,
                    percentiles
                );
            },
            hasMetric(name: string): boolean {
                return promMetrics.hasMetric(name);
            },
            deleteMetric(name: string): boolean {
                return promMetrics.deleteMetric(name);
            },
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
}
