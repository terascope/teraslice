'use strict';

const get = require('lodash/get');
const { JobValidator } = require('@terascope/teraslice-validators');
const { terasliceOpPath, makeJobStore, makeExStore } = require('teraslice');

async function validateJob(context, jobSpec) {
    const jobValidator = new JobValidator(context, {
        terasliceOpPath,
        assetPath: get(context, 'sysconfig.teraslice.assets_directory'),
        opPath: get(context, 'sysconfig.teraslice.ops_directory')
    });

    try {
        return jobValidator.validate(jobSpec);
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
