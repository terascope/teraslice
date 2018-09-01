'use strict';

const _ = require('lodash');
const { newFormattedDate } = require('teraslice');
const { makeLogger } = require('../utils/context');

class ExecutionAnalytics {
    constructor(context, executionContext, client) {
        this.logger = makeLogger(context, executionContext, 'execution_analytics');
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.client = client;
        this.analyticsRate = _.get(context, 'sysconfig.teraslice.analytics_rate');
    }

    start() {
        const {
            ex_id: exId,
            job_id: jobId,
        } = this.executionContext;
        const { name } = this.executionContext.job;

        this.executionAnalytics = {
            workers_available: 0,
            workers_active: 0,
            workers_joined: 0,
            workers_reconnected: 0,
            workers_disconnected: 0,
            failed: 0,
            subslices: 0,
            queued: 0,
            slice_range_expansion: 0,
            processed: 0,
            slicers: 0,
            subslice_by_key: 0,
            started: newFormattedDate(),
        };

        this.pushedAnalytics = {
            processed: 0,
            failed: 0,
            queued: 0,
            job_duration: 0,
            workers_joined: 0,
            workers_disconnected: 0,
            workers_reconnected: 0
        };

        this.events.on('slicer:slice:recursion', () => {
            this.logger.trace('id subslicing has occurred');
            this.increment('subslices');
        });

        this.events.on('slicer:slice:range_expansion', () => {
            this.logger.trace('a slice range expansion has occurred');
            this.increment('slice_range_expansion');
        });

        this.client.onExecutionAnalytics(() => ({
            name,
            ex_id: exId,
            job_id: jobId,
            stats: this.executionAnalytics
        }));

        this.sendingAnalytics = true;

        const sendAnalytics = async () => {
            if (!this.sendingAnalytics) return;
            await Promise.delay(this.analyticsRate);
            await this._pushAnalytics();
        };

        sendAnalytics();
    }

    set(key, value) {
        _.set(this.executionAnalytics, key, value);
    }

    increment(key) {
        _.update(this.executionAnalytics, key, c => c + 1);
    }

    get() {
        return this.executionAnalytics;
    }

    getAnalytics() {
        return _.cloneDeep(this.executionAnalytics);
    }

    async shutdown() {
        this.sendingAnalytics = false;

        await this._pushAnalytics();
    }

    async _pushAnalytics() {
        // save a copy of what we push so we can emit diffs
        const diffs = {};
        const copy = {};
        _.forOwn(this.pushedAnalytics, (value, field) => {
            diffs[field] = _.get(this.executionAnalytics, field) - value;
            copy[field] = _.get(this.executionAnalytics, field);
        });

        await this.client.sendClusterAnalytics(diffs);

        this.pushedAnalytics = copy;
    }
}

module.exports = ExecutionAnalytics;
