'use strict';

const { get } = require('@terascope/utils');
const { makeContextLogger } = require('@terascope/job-components');

function generateWorkerId(context) {
    const { hostname } = context.sysconfig.teraslice;
    const clusterId = get(context, 'cluster.worker.id');
    return `${hostname}__${clusterId}`;
}

function makeLogger(context, executionContext, moduleName, extra = {}) {
    const { exId, jobId } = executionContext;

    return makeContextLogger(
        context,
        moduleName,
        Object.assign({}, extra, { ex_id: exId, job_id: jobId })
    );
}

module.exports = { generateWorkerId, makeLogger };
