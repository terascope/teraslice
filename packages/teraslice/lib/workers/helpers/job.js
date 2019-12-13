'use strict';

const { get, isEmpty } = require('@terascope/utils');
const { JobValidator } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const { makeJobStore, makeExStore, makeStateStore } = require('../../cluster/storage');

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

async function initializeJob({
    context,
    config,
    stores = {},
    isRecovery,
    cleanupType,
    recoverySlices = [],
    lastStatus = 'failed'
}) {
    const jobStore = stores.jobStore || (await makeJobStore(context));
    const exStore = stores.exStore || (await makeExStore(context));
    const stateStore = stores.stateStore || (await makeStateStore(context));

    const validJob = await validateJob(context, config, { skipRegister: true });
    const jobSpec = await jobStore.create(config);

    const jobConfig = Object.assign({}, jobSpec, validJob);

    const slicerHostname = jobConfig.slicer_hostname;
    const slicerPort = jobConfig.slicer_port;

    let ex;
    if (isRecovery) {
        const recoverEx = await exStore.create(jobConfig, lastStatus);
        const promises = recoverySlices.map((recoverySlice) => {
            const { slice, state } = recoverySlice;
            return stateStore.createState(recoverEx.ex_id, slice, state, slice.error);
        });

        await Promise.all(promises);
        await stateStore.refresh();

        ex = await exStore.createRecoveredExecution(recoverEx, cleanupType);
    } else {
        ex = await exStore.create(jobConfig);
    }

    ex.slicer_hostname = slicerHostname;
    ex.slicer_port = slicerPort;

    if (isEmpty(stores)) {
        await Promise.all([
            exStore.shutdown(true),
            jobStore.shutdown(true),
            stateStore.shutdown(true)
        ]);
    }

    return {
        job: jobConfig,
        ex,
    };
}

module.exports = {
    initializeJob,
    validateJob,
};
