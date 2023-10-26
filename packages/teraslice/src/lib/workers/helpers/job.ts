import { makeISODate } from '@terascope/utils';
import { JobValidator, Context } from '@terascope/job-components';
import { terasliceOpPath } from '../../config';
import { makeJobStore, makeExStore, makeStateStore } from '../../storage';

// TODO: fix type here
export async function validateJob(context: Context, jobSpec: any) {
    const jobValidator = new JobValidator(context, {
        terasliceOpPath,
    });

    try {
        return await jobValidator.validateConfig(jobSpec);
    } catch (error) {
        throw new Error(`validating job: ${error}`);
    }
}

export async function initializeTestExecution({
    context,
    config,
    stores = {},
    isRecovery,
    cleanupType,
    createRecovery = true,
    shutdownStores = false,
    recoverySlices = [],
    lastStatus = 'failed'
}) {
    stores.jobStore = stores.jobStore || (await makeJobStore(context));
    stores.exStore = stores.exStore || (await makeExStore(context));
    stores.stateStore = stores.stateStore || (await makeStateStore(context));

    const validJob = await validateJob(context, config, { skipRegister: true });
    const jobSpec = await stores.jobStore.create(config);

    const job = Object.assign({}, jobSpec, validJob, {
        job_id: jobSpec.job_id
    });

    const slicerHostname = job.slicer_hostname;
    const slicerPort = job.slicer_port;

    let ex;
    if (isRecovery) {
        ex = await stores.exStore.create(job, lastStatus);

        if (recoverySlices.length) {
            await Promise.all(recoverySlices
                .map(({ slice, state }) => stores.stateStore.createState(
                    ex.ex_id,
                    slice,
                    state,
                    slice.error
                )));
            await stores.stateStore.refresh();
        }

        if (createRecovery) {
            ex = await stores.exStore.createRecoveredExecution(ex, cleanupType);
        }
    } else {
        ex = await stores.exStore.create(job);
    }

    if (slicerHostname && slicerPort) {
        ex = await stores.exStore.updatePartial(ex.ex_id, (existing) => Object.assign(existing, {
            slicer_hostname: slicerHostname,
            slicer_port: slicerPort,
            _updated: makeISODate()
        }));
    }

    if (shutdownStores) {
        await Promise.all([
            stores.exStore.shutdown(true),
            stores.jobStore.shutdown(true),
            stores.stateStore.shutdown(true)
        ]);
    }

    return {
        job,
        ex,
    };
}
