'use strict';

const Promise = require('bluebird');
const get = require('lodash/get');
const { JobValidator } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const { makeJobStore, makeExStore } = require('../../cluster/storage');

async function validateJob(context, jobSpec) {
    const jobValidator = new JobValidator(context, {
        terasliceOpPath,
        assetPath: get(context, 'sysconfig.teraslice.assets_directory'),
    });

    try {
        return jobValidator.validateConfig(jobSpec);
    } catch (error) {
        throw new Error(`validating job: ${error}`);
    }
}

async function initializeJob(context, config, stores = {}) {
    const jobStore = stores.jobStore || await makeJobStore(context);
    const exStore = stores.exStore || await makeExStore(context);

    const validJob = await validateJob(context, config, { skipRegister: true });
    const jobSpec = await jobStore.create(config);

    const job = Object.assign({}, jobSpec, validJob);

    const ex = await exStore.create(job, 'ex');
    await exStore.setStatus(ex.ex_id, 'pending');

    if (!Object.keys(stores).length) {
        await Promise.all([
            exStore.shutdown(true),
            jobStore.shutdown(true),
        ]);
    }

    return {
        job,
        ex,
    };
}

module.exports = {
    initializeJob,
    validateJob,
};
