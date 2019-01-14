'use strict';

const _ = require('lodash');

function generateWorkerId(context) {
    const { hostname } = context.sysconfig.teraslice;
    const clusterId = _.get(context, 'cluster.worker.id');
    return `${hostname}__${clusterId}`;
}

function makeLogger(context, executionContext, moduleName, extra = {}) {
    const {
        exId,
        jobId,
    } = executionContext;
    const {
        assignment,
        cluster,
    } = context;

    return context.apis.foundation.makeLogger(Object.assign({
        ex_id: exId,
        job_id: jobId,
        module: moduleName,
        worker_id: cluster.worker.id,
        assignment,
    }, extra));
}

module.exports = { generateWorkerId, makeLogger };
