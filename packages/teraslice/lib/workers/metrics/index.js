/* eslint-disable no-console */

'use strict';

const { EventEmitter } = require('events');
const { makeISODate, pDelay, debugLogger } = require('@terascope/utils');

const _logger = debugLogger('metrics');

class Metrics extends EventEmitter {
    constructor({ enabled = true, logger, statsInterval = 5000 }) {
        super();
        this.enabled = enabled;
        this.logger = logger
            ? logger.child({
                module: 'performance:metrics'
            })
            : _logger;
        this.statsInterval = statsInterval;
        this.intervals = [];
        if (this.enabled) {
            this.emitter = require('@newrelic/native-metrics')({
                timeout: statsInterval
            });
            this.logger.info('performance metrics are enabled');
        } else {
            this.logger.info('performance metrics are disabled');
        }
    }

    async initialize() {
        if (!this.enabled) return;

        const { gcEnabled, loopEnabled, usageEnabled } = this.emitter;
        this.logger.info('starting performance metrics', {
            gcEnabled,
            loopEnabled,
            usageEnabled
        });

        if (gcEnabled) {
            this.intervals.push(
                setInterval(() => {
                    this._emitGCMetrics();
                }, this.statsInterval)
            );
        }

        if (usageEnabled) {
            this.emitter.on('usage', (usage) => {
                this._emitUsageMetrics(usage);
            });
        }

        if (loopEnabled) {
            this.intervals.push(
                setInterval(() => {
                    this._emitLoopMetrics();
                }, this.statsInterval)
            );
        }
    }

    async shutdown() {
        this.intervals.forEach(clearInterval);
        this.intervals = [];
        if (this.emitter != null) {
            this.emitter.unbind();
        }
        this.removeAllListeners();
    }

    _emitUsageMetrics(usage) {
        this._emitMetric('usage', usage);
    }

    _emitGCMetrics() {
        const gcMetrics = this.emitter.getGCMetrics();
        for (const [type, metric] of Object.entries(gcMetrics)) {
            this._emitMetric('gc', {
                type_id: metric.type_name,
                type_name: type,
                metrics: metric.metrics
            });
        }
    }

    _emitLoopMetrics() {
        const loopMetrics = this.emitter.getLoopMetrics();
        this._emitMetric('loop', {
            total_time: loopMetrics.usage.total,
            min_time: loopMetrics.usage.min,
            max_time: loopMetrics.usage.max,
            sum_of_squares: loopMetrics.usage.sumOfSquares,
            count: loopMetrics.usage.count
        });
    }

    _emitMetric(type, data) {
        const msg = {
            type,
            timestamp: makeISODate(),
            data
        };
        this.emit('metric', msg);
        this.logger.info(msg, `performance metrics for type ${type}`);
    }
}

if (require.main === module) {
    (async () => {
        const metrics = new Metrics();
        metrics.on('metric', (metric) => {
            console.dir(metric);
        });

        try {
            await metrics.initialize();
            console.log('staying alive for 30s...');
            await pDelay(30000);
            console.log('done, exiting...');
        } catch (err) {
            console.error(err);
            process.exitCode = 1;
        } finally {
            await metrics.shutdown();
            process.exit();
        }
    })();
} else {
    module.exports = Metrics;
}
