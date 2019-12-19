'use strict';

const { get, isEmpty } = require('@terascope/utils');
const { JobValidator } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const { makeJobStore, makeExStore, makeStateStore } = require('../../storage');

async function validateJob(context, jobSpec) {
    const jobValidator = new JobValidator(context, {
        terasliceOpPath,
        assetPath: get(context, 'sysconfig.teraslice.assets_directory'),
    });

    try {
        return await jobValidator.validateConfig(jobSpec);
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

    const job = Object.assign({}, jobSpec, validJob, {
        job_id: jobSpec.job_id
    });

    const slicerHostname = job.slicer_hostname;
    const slicerPort = job.slicer_port;

    let ex;
    if (isRecovery) {
        ex = await exStore.create(job, lastStatus);

        if (recoverySlices.length) {
            await Promise.all(recoverySlices.map(({ slice, state }) => stateStore.createState(
                ex.ex_id,
                slice,
                state,
                slice.error
            )));
            await stateStore.refresh();
        }

        if (createRecovery) {
            ex = await exStore.createRecoveredExecution(ex, cleanupType);
        }
    } else {
        ex = await exStore.create(job);
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
        job,
        ex,
    };
}

module.exports = {
    initializeTestExecution,
    validateJob,
};
