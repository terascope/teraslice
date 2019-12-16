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

async function initializeTestExecution({
    context,
    config,
    stores = {},
    isRecovery,
    cleanupType,
    createRecovery = true,
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
        ex = await exStore.create(jobConfig, lastStatus);
        const promises = recoverySlices.map((recoverySlice) => {
            const { slice, state } = recoverySlice;
            return stateStore.createState(ex.ex_id, slice, state, slice.error);
        });

        await Promise.all(promises);
        await stateStore.refresh();

        if (createRecovery) {
            ex = await exStore.createRecoveredExecution(ex, cleanupType);
        }
    } else {
        ex = await exStore.create(jobConfig);
    }

    if (slicerHostname && slicerPort) {
        ex.slicer_hostname = slicerHostname;
        ex.slicer_port = slicerPort;
    }

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
    initializeTestExecution,
    validateJob,
};
