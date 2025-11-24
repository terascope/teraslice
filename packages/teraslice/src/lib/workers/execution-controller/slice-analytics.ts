import {
    has, isInteger, Logger,
    toNumber
} from '@terascope/core-utils';
import type { Context, ExecutionContext, OpConfig } from '@terascope/job-components';
import type { SliceAnalyticsData, SliceCompletePayload } from '@terascope/types';
import type { EventEmitter } from 'node:events';
import { makeLogger } from '../helpers/terafoundation.js';

interface SliceOperationStat {
    min: number;
    max: number;
    sum: number;
    total: number;
    average: number;
}

interface SliceAnalyticsStats {
    time: SliceOperationStat[];
    size: SliceOperationStat[];
    memory: SliceOperationStat[];
}

// TODO: more types
export class SliceAnalytics {
    logger: Logger;
    events: EventEmitter;
    sliceAnalytics: SliceAnalyticsStats;
    operations: OpConfig[];

    constructor(context: Context, executionContext: ExecutionContext) {
        this.logger = makeLogger(context, 'slice_analytics');
        this.events = context.apis.foundation.getSystemEvents();

        const { operations } = executionContext.config;
        this.operations = operations;
        // create a container to hold all the slice analytics for this execution
        this.sliceAnalytics = {
            time: [],
            size: [],
            memory: []
        } as SliceAnalyticsStats;

        const opsLength = this.operations.length;

        for (let i = 0; i < opsLength; i += 1) {
            this.sliceAnalytics.time.push({
                min: 0,
                max: 0,
                sum: 0,
                total: 0,
                average: 0
            } as SliceOperationStat);
            this.sliceAnalytics.size.push({
                min: 0,
                max: 0,
                sum: 0,
                total: 0,
                average: 0
            } as SliceOperationStat);
            this.sliceAnalytics.memory.push({
                min: 0,
                max: 0,
                sum: 0,
                total: 0,
                average: 0
            } as SliceOperationStat);
        }

        this.events.on('slice:success', this.onSliceSuccess.bind(this));
    }

    addStat(input: SliceAnalyticsData, stat: keyof SliceAnalyticsData) {
        if (!has(input, stat) || !has(this.sliceAnalytics, stat)) {
            this.logger.warn(`unsupported stat "${stat}"`);
            return;
        }

        for (let i = 0; i < this.operations.length; i += 1) {
            const val = input[stat][i];
            if (!isInteger(val)) {
                return;
            }

            this.sliceAnalytics[stat][i].sum += val;
            this.sliceAnalytics[stat][i].total += 1;

            const {
                min, max, total, sum
            } = this.sliceAnalytics[stat][i];

            this.sliceAnalytics[stat][i].min = min !== 0 ? Math.min(val, min) : val;
            this.sliceAnalytics[stat][i].max = max !== 0 ? Math.max(val, max) : val;
            this.sliceAnalytics[stat][i].average = toNumber((sum / total).toFixed(2));
        }
    }

    addStats(data: SliceAnalyticsData) {
        this.addStat(data, 'time');
        this.addStat(data, 'memory');
        this.addStat(data, 'size');
    }

    analyzeStats() {
        this.logger.info('calculating statistics');

        for (let i = 0; i < this.operations.length; i += 1) {
            const name = this.operations[i]._op;
            const time = this.sliceAnalytics.time[i];
            const size = this.sliceAnalytics.size[i];
            const memory = this.sliceAnalytics.memory[i];

            this.logger.info(`
operation ${name}
average completion time of: ${time.average} ms, min: ${time.min} ms, and max: ${time.max} ms
average size: ${size.average}, min: ${size.min}, and max: ${size.max}
average memory: ${memory.average}, min: ${memory.min}, and max: ${memory.max}
            `);
        }
    }

    getStats() {
        return this.sliceAnalytics;
    }

    private onSliceSuccess({ analytics }: SliceCompletePayload) {
        if (analytics) {
            this.addStats(analytics);
        }
    }

    async shutdown() {
        this.events.removeListener('slice:success', this.onSliceSuccess.bind(this));
    }
}
