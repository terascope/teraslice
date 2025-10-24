import { makeISODate } from '@terascope/date-utils';
import {
    JobValidator, Context, RecoveryCleanupType,
    Slice, JobConfigParams
} from '@terascope/job-components';
import { ExecutionConfig, JobConfig } from '@terascope/types';
import { JobsStorage, ExecutionStorage, StateStorage } from '../../storage/index.js';

// TODO: fix type here
export async function validateJob(context: Context, jobSpec: JobConfigParams) {
    const jobValidator = new JobValidator(context);

    try {
        return await jobValidator.validateConfig(jobSpec);
    } catch (error) {
        throw new Error(`validating job: ${error}`);
    }
}

interface TestExecution {
    context: Context;
    config: JobConfig | ExecutionConfig;
    stores?: { jobStore: JobsStorage; exStore: ExecutionStorage; stateStore: StateStorage };
    isRecovery?: boolean;
    cleanupType?: RecoveryCleanupType;
    createRecovery?: boolean;
    shutdownStores?: boolean;
    recoverySlices?: Slice[];
    lastStatus?: string;
}

export async function initializeTestExecution({
    context,
    config,
    stores = {} as any,
    isRecovery = false,
    cleanupType,
    createRecovery = true,
    shutdownStores = false,
    recoverySlices = [],
    lastStatus = 'failed'
}: TestExecution) {
    if (!stores.jobStore) {
        const [jobStore, exStore, stateStore] = await Promise.all([
            (async () => {
                const store = new JobsStorage(context);
                await store.initialize();
                return store;
            })(),
            (async () => {
                const store = new ExecutionStorage(context);
                await store.initialize();
                return store;
            })(),
            (async () => {
                const store = new StateStorage(context);
                await store.initialize();
                return store;
            })(),
        ]);
        stores.jobStore = jobStore;
        stores.exStore = exStore;
        stores.stateStore = stateStore;
    }

    const validJob = await validateJob(context, config);
    const jobSpec = await stores.jobStore.create(config);

    const job = Object.assign({}, jobSpec, validJob, {
        job_id: jobSpec.job_id
    });

    // @ts-expect-error
    const slicerHostname = job.slicer_hostname;
    // @ts-expect-error
    const slicerPort = job.slicer_port;

    let ex: any;

    if (isRecovery) {
        ex = await stores.exStore.create(job, lastStatus);

        if (recoverySlices.length) {
            await Promise.all(recoverySlices
                .map(({ slice, state }: any) => stores.stateStore.createState(
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
        ex = await stores.exStore.updatePartial(
            ex.ex_id,
            async (existing) => Object.assign(existing, {
                slicer_hostname: slicerHostname,
                slicer_port: slicerPort,
                _updated: makeISODate()
            })
        );
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
