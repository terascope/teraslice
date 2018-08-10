'use strict';

const _ = require('lodash');
const newId = require('./new-id');
const { makeContext } = require('../terafoundation');
const { getTerasliceConfig } = require('../teraslice');

function generateContext(sysconfig, useDebugLogger) {
    if (!_.isPlainObject(sysconfig) || _.isEmpty(sysconfig)) {
        throw new Error('Worker requires a valid terafoundation configuration');
    }

    const config = getTerasliceConfig({ name: 'teraslice-worker' });
    const cluster = {
        worker: {
            id: newId()
        }
    };
    return makeContext(cluster, config, sysconfig, useDebugLogger);
}

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

module.exports = { generateContext, generateWorkerId, makeLogger };
