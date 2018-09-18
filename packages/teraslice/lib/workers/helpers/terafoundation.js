'use strict';

const _ = require('lodash');

function generateWorkerId(context) {
    const { hostname } = context.sysconfig.teraslice;
    const clusterId = _.get(context, 'cluster.worker.id');
    return `${hostname}__${clusterId}`;
}

function makeLogger(context, executionContext, moduleName, extra = {}) {
    const {
        ex_id: exId,
        job_id: jobId,
        assignment
    } = executionContext;

    return context.apis.foundation.makeLogger(_.assign({
        ex_id: exId,
        job_id: jobId,
        module: moduleName,
        worker_id: context.cluster.id,
        assignment,
    }, extra));
}

module.exports = { generateWorkerId, makeLogger };
