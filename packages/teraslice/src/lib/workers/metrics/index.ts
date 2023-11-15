/* eslint-disable no-console */
import { EventEmitter } from 'node:events';
import {
    // TODO: fix this
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pDelay, debugLogger, isTest,
    Logger
} from '@terascope/utils';

const defaultLogger = debugLogger('metrics');

export class Metrics extends EventEmitter {
    private logger: Logger;
    private _intervals: any[];
    private eventLoopInterval: number;
    // TODO: fix types here
    private _typesCollectedAt: Record<string, any>;
    private gcStats: any;
    private eventLoopStats: any;

    constructor(config?: { logger: Logger }) {
        super();
        const argLogger = config && config.logger;
        this.logger = argLogger
            ? argLogger.child({
                module: 'performance:metrics'
            })
            : defaultLogger;

        this.eventLoopInterval = isTest ? 100 : 5000;
        this._intervals = [];
        this._typesCollectedAt = {};

        // never cause an unwanted error
        try {
            this.gcStats = require('gc-stats')();
        } catch (err) {
            this.logger.error(err, 'Failure to construct gc-stats');
        }

        try {
            this.eventLoopStats = require('event-loop-stats');
        } catch (err) {
            this.logger.error(err, 'Failure to construct event-loop-stats');
        }
    }

    async initialize() {
        const gcEnabled = this.gcStats != null;
        const loopEnabled = this.eventLoopStats != null;

        this.logger.info('initializing performance metrics', {
            gcEnabled,
            loopEnabled
        });

        if (gcEnabled) {
            // https://github.com/dainis/node-gcstats#property-insights
            const typesToName = {
                1: 'Scavenge',
                2: 'MarkSweepCompact',
                4: 'IncrementalMarking',
                8: 'WeakPhantomCallbackProcessing',
                15: 'All'
            };

            this.gcStats.on('stats', (metrics: any) => {
                // never cause an unwanted error
                if (!metrics) {
                    this.logger.warn('invalid metrics received for gc stats', metrics);
                    return;
                }

                const typeName = typesToName[metrics.gctype];
                this._emitMetric('gc-stats', Object.assign({ typeName }, metrics));
            });
        }

        if (loopEnabled) {
            // https://github.com/bripkens/event-loop-stats#property-insights
            this._intervals.push(
                setInterval(() => {
                    // never cause an unwanted error
                    let metrics;
                    try {
                        metrics = this.eventLoopStats.sense();
                    } catch (err) {
                        this.logger.error(err, 'failure getting for event-loop-stats');
                        return;
                    }

                    if (!metrics) {
                        this.logger.warn('invalid metrics received for event-loop-stats', metrics);
                        return;
                    }

                    this._emitMetric('event-loop-stats', metrics);
                }, this.eventLoopInterval)
            );
        }
    }

    async shutdown() {
        try {
            this._intervals.forEach(clearInterval);
            this._intervals = [];
            this.removeAllListeners();
            this._typesCollectedAt = {};
        } catch (err) {
            this.logger.debug(err, 'failure shutting down metrics');
        }
    }

    private _emitMetric(type: string, metrics: any) {
        const lastCollectedAt = this._typesCollectedAt[type] || Date.now();
        const msg = {
            type,
            timeSinceLast: Date.now() - lastCollectedAt,
            metrics
        };
        this._typesCollectedAt[type] = Date.now();
        console.dir({ msg, metrics, _emitMetric: true }, { depth: 40 })

        this.emit('metric', msg);
        this.logger.info(msg, `${type} performance metrics`);
    }
}

// if (require.main === module) {
//     (async () => {
//         const metrics = new Metrics();
//         metrics.on('metric', (metric) => {
//             console.dir(metric);
//         });

//         try {
//             await metrics.initialize();
//             console.log('staying alive for 30s...');
//             await pDelay(30000);
//             console.log('done, exiting...');
//         } catch (err) {
//             console.error(err);
//             process.exitCode = 1;
//         } finally {
//             await metrics.shutdown();
//             process.exit();
//         }
//     })();
// } else {
//     module.exports = Metrics;
// }
