'use strict';

const moment = require('moment');
const dateFormat = require('../../utils/date_utils').dateFormat;
const _ = require('lodash');

module.exports = function module(context, messaging) {
    const events = context.apis.foundation.getSystemEvents();
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const logger = context.apis.foundation.makeLogger({ module: 'execution_analytics', ex_id: exId, job_id: jobId });

    const executionAnalytics = {
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
        started: moment().format(dateFormat)
    };

    // a place for tracking differences so collector (cluster master) does not have to
    // manage extra state
    // TODO change job_duration
    let pushedAnalytics = {
        processed: 0,
        failed: 0,
        queued: 0,
        job_duration: 0,
        workers_joined: 0,
        workers_disconnected: 0,
        workers_reconnected: 0
    };

    events.on('slicer:slice:recursion', () => {
        logger.trace('id sublicing has occurred');
        executionAnalytics.subslices += 1;
    });

    events.on('slicer:slice:range_expansion', () => {
        logger.trace('a slice range expansion has occurred');
        executionAnalytics.slice_range_expansion += 1;
    });

    messaging.register({
        event: 'cluster:slicer:analytics',
        callback: (msg) => {
            logger.debug('api is requesting execution analytics', executionAnalytics);
            const name = JSON.parse(process.env.job).name;
            messaging.respond(msg, {
                node_id: msg.node_id,
                job_id: jobId,
                ex_id: exId,
                payload: { name, stats: executionAnalytics }
            });
        }
    });


    function _pushAnalytics() {
        // save a copy of what we push so we can emit diffs
        const diffs = {};
        const copy = {};
        _.forOwn(pushedAnalytics, (value, field) => {
            diffs[field] = executionAnalytics[field] - value;
            copy[field] = executionAnalytics[field];
        });

        messaging.send({
            to: 'cluster_master',
            message: 'cluster:analytics',
            payload: { kind: 'slicer', stats: diffs }
        });
        pushedAnalytics = copy;
    }

    // push analytics to cluster master to support cluster level analytics
    const analyticsTimer = setInterval(_pushAnalytics, context.sysconfig.teraslice.analytics_rate);

    function setValue(key, value) {
        executionAnalytics[key] = value;
    }

    function increment(key) {
        executionAnalytics[key] += 1;
    }

    function getAnalytics() {
        return _.cloneDeep(executionAnalytics);
    }

    function shutdown() {
        _pushAnalytics();
        clearInterval(analyticsTimer);
    }

    return {
        set: setValue,
        increment,
        getAnalytics,
        shutdown
    };
};
