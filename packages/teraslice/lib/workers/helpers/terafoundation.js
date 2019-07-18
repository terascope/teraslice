'use strict';

const { get, isFunction, isString } = require('@terascope/utils');
const { makeContextLogger } = require('@terascope/job-components');
const { safeDecode } = require('../../utils/encoding_utils');

function generateWorkerId(context) {
    const { hostname } = context.sysconfig.teraslice;
    const clusterId = get(context, 'cluster.worker.id');
    return `${hostname}__${clusterId}`;
}

function makeLogger(context, moduleName, extra = {}) {
    if (!context || !context.apis) {
        throw new Error('makeLogger expected terafoundation context as first arg');
    }

    if (!moduleName || !isString(moduleName)) {
        throw new Error('makeLogger expected module name as second arg');
    }

    const exAPI = context.apis.executionContext;
    if (exAPI && isFunction(exAPI.makeLogger)) {
        return exAPI.makeLogger(moduleName, extra);
    }

    const defaultContext = {};
    if (process.env.EX) {
        const ex = safeDecode(process.env.EX);
        const exId = get(ex, 'ex_id');
        const jobId = get(ex, 'job_id');
        if (exId) {
            defaultContext.ex_id = exId;
        }
        if (jobId) {
            defaultContext.job_id = jobId;
        }
    }

    return makeContextLogger(context, moduleName, Object.assign(defaultContext, extra));
}

module.exports = { generateWorkerId, makeLogger };
