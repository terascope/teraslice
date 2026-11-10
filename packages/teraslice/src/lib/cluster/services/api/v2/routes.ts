import { generateJobJSONSchema } from '@terascope/job-components';
import {
    parseList, TSError, logError, pDelay
} from '@terascope/core-utils';
import { type Logger, type ExecutionStatus, TerasliceApiV2 } from '@terascope/types';
import type { ApiService } from '../api.js';
import type { ControllerStats } from '../../../../../interfaces.js';
import {
    createJobActiveQuery, addDeletedToQuery, addFilterToQuery, buildConnectorList
} from '../../../../utils/api_utils.js';
import { getPackageJSON } from '../../../../utils/file_utils.js';
import { createRouteRegistry, type RouteRegistry } from '../../../../utils/v2_routes.js';

const terasliceVersion = getPackageJSON().version;

/** How often `_stop` checks whether the execution has stopped */
const stopPollInterval = 3000;

/** A stored record as sent from opensearch */
type FromStorage<T> = {
    [K in keyof T]: K extends 'log_level'
        ? Logger.LogLevelString | null
        : Exclude<T[K], Date>
};

/**
 * Narrows a job or execution record's top-level fields to what storage
 * actually holds, to match the v2 response schemas:
 * - timestamps are typed `string | Date`, but records are read as JSON, so
 *   they're always strings
 * - `log_level` is typed `string`, but the job schema only accepts a log
 *   level name (or nothing), so that's all a stored record can hold
 *
 * The mapped type also lets these interfaces satisfy the loose (index
 * signature) schemas.
 */
function fromStorage<T extends object>(record: T): FromStorage<T> {
    return record as FromStorage<T>;
}

/**
 * `ControllerStats` types `started` and `queuing_complete` as
 * `string | number | Date`, but the execution controller always sets them
 * with `makeISODate()` and they arrive over socket.io as strings. Narrow just
 * those two fields so the rest of the stats stay type checked against the
 * v2 response schema.
 */
function toControllerStatsResponse(
    stats: ControllerStats[]
): TerasliceApiV2.ControllerStatsList {
    return stats.map((stat) => ({
        ...stat,
        started: stat.started as string | undefined,
        queuing_complete: stat.queuing_complete as string | undefined,
    }));
}

/** The paging, sorting and filter options every list route parses */
interface SearchOptions {
    size: number;
    from: number;
    sort: string;
    filter?: string;
}

/**
 * The sort to search with. v1 falls back to the default for `?sort=` (empty)
 * as well as for no `sort`; the schema default only covers the latter.
 */
function sortOrDefault(sort: string): string {
    return sort || '_updated:desc';
}

/**
 * Routes for the beta /v2 API. Mounted only at /v2, with no unversioned alias.
 * See https://github.com/terascope/teraslice/issues/4584
 */
export function createV2Registry(api: ApiService): RouteRegistry {
    const registry = createRouteRegistry();

    async function getLatestExId(jobId: string): Promise<string> {
        const exId = await api.jobsService.getLatestExecutionId(jobId);

        if (!exId) {
            throw new TSError(`No executions were found for job: ${jobId}`, {
                statusCode: 404
            });
        }
        return exId;
    }

    /**
     * Polls the execution's status every few seconds until it is terminal,
     * or returns the current status straight away when `blocking` is false.
     * A failed lookup is logged and retried, as in v1, so this never rejects.
     * v2's copy of ApiService's `_waitForStop`, so v2 doesn't reach into
     * ApiService internals.
     */
    async function waitForStop(exId: string, blocking: boolean): Promise<ExecutionStatus> {
        const terminalStatuses: readonly string[] = api.executionStorage.getTerminalStatuses();

        while (true) {
            try {
                const { _status: status } = await api.executionService.getExecutionContext(exId);
                if (!blocking || terminalStatuses.includes(status)) return status;
            } catch (err) {
                logError(api.logger, err, 'failure waiting for stop');
            }
            await pDelay(stopPollInterval);
        }
    }

    async function searchErrors(
        exId: string, { size, from, sort, filter }: SearchOptions
    ): Promise<TerasliceApiV2.SliceErrorList> {
        const errorQuery = addFilterToQuery(`state:error AND ex_id:"${exId}"`, filter ?? '');
        // StateStorage.search returns the backend's untyped search result,
        // unlike JobsStorage/ExecutionStorage, which cast to their record type
        const slices = await api.stateStorage.search(errorQuery, from, size, sortOrDefault(sort));
        return slices as TerasliceApiV2.SliceErrorList;
    }

    // Cluster

    registry.get('/', {
        operationId: 'getClusterInfo',
        summary: 'Get cluster and version information',
        tags: ['Cluster'],
        response: TerasliceApiV2.ClusterInfoSchema,
    }, () => ({
        arch: api.context.arch,
        clustering_type: api.context.sysconfig.teraslice.cluster_manager_type,
        name: api.context.sysconfig.teraslice.name,
        node_version: process.version,
        platform: api.context.platform,
        teraslice_version: `v${terasliceVersion}`
    }));

    registry.get('/cluster/state', {
        operationId: 'getClusterState',
        summary: 'Get the state of every node in the cluster',
        tags: ['Cluster'],
        response: TerasliceApiV2.ClusterStateSchema,
    }, () => api.clusterService.getClusterState());

    registry.get('/cluster/connectors', {
        operationId: 'getClusterConnectors',
        summary: 'List the configured connectors',
        tags: ['Cluster'],
        query: TerasliceApiV2.GetClusterConnectorsQuerySchema,
        response: TerasliceApiV2.ConnectorListResponseSchema,
    }, ({ query }) => ({
        connectors: buildConnectorList(api.context.sysconfig, query)
    }));

    registry.get('/cluster/job-schema', {
        operationId: 'getClusterJobSchema',
        summary: 'Get the JSON Schema for job configs on this cluster',
        tags: ['Cluster'],
        response: TerasliceApiV2.JobSchemaResponseSchema,
    }, () => ({
        version: terasliceVersion,
        job_schema: generateJobJSONSchema(api.context)
    }));

    registry.get('/cluster/stats', {
        operationId: 'getClusterStats',
        summary: 'Get slice and worker stats across all executions',
        tags: ['Cluster'],
        response: TerasliceApiV2.ClusterStatsSchema,
    }, () => api.executionService.getClusterAnalytics(), {
        errorMessage: 'Could not get cluster statistics'
    });

    registry.get('/cluster/controllers', {
        operationId: 'getClusterControllers',
        summary: 'Get statistics for every running execution controller',
        tags: ['Cluster'],
        response: TerasliceApiV2.ControllerStatsListSchema,
    }, async () => toControllerStatsResponse(await api.executionService.getControllerStats()), {
        errorMessage: 'Could not get execution statistics'
    });

    // Jobs

    registry.get('/jobs', {
        operationId: 'getJobs',
        summary: 'List jobs',
        tags: ['Jobs'],
        query: TerasliceApiV2.GetJobsQuerySchema,
        response: TerasliceApiV2.JobWithExecutionListSchema,
    }, async ({ query }) => {
        const { size, from } = query;
        const { active, deleted, ex } = query;
        const sort = sortOrDefault(query.sort);

        let partialQuery = createJobActiveQuery(active === undefined ? '' : `${active}`);
        partialQuery = addDeletedToQuery(`${deleted}`, partialQuery);
        const searchQuery = addFilterToQuery(partialQuery, query.filter ?? '');

        if (ex === undefined) {
            const jobs = await api.jobsStorage.search(searchQuery, from, size, sort);
            return jobs.map((job) => fromStorage(job));
        }

        // `?ex=` (no fields) includes the whole execution
        const fields = parseList(ex);
        const jobs = await api.jobsService.getJobsWithExInfo(
            searchQuery, from, size, sort, fields.length ? fields : undefined
        );
        return jobs.map((job) => fromStorage(job));
    }, { errorMessage: 'Could not retrieve list of jobs' });

    registry.post('/jobs', {
        operationId: 'submitJob',
        summary: 'Submit a job, and start it unless `start` is `false`',
        tags: ['Jobs'],
        query: TerasliceApiV2.SubmitJobQuerySchema,
        body: TerasliceApiV2.JobConfigBodySchema,
        response: TerasliceApiV2.SubmitJobResultSchema,
    }, ({ query, body }) => api.jobsService.submitJob(body, query.start), {
        errorMessage: 'Job submission failed'
    });

    registry.get('/jobs/:jobId', {
        operationId: 'getJob',
        summary: 'Get a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.GetJobQuerySchema,
        response: TerasliceApiV2.JobWithExecutionSchema,
    }, async ({ params: { jobId }, query: { ex } }) => {
        if (ex === undefined) return fromStorage(await api.jobsStorage.get(jobId));

        // `?ex=` (no fields) includes the whole execution
        const fields = parseList(ex);
        const job = await api.jobsService.getJobWithExInfo(
            jobId, fields.length ? fields : undefined
        );
        return fromStorage(job);
    }, { errorMessage: 'Could not retrieve job' });

    // The body replaces the stored job; it isn't merged into it
    registry.put('/jobs/:jobId', {
        operationId: 'updateJob',
        summary: 'Replace a job\'s config',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        body: TerasliceApiV2.JobConfigBodySchema,
        response: TerasliceApiV2.UpdatedJobSchema,
    }, async ({ params, body }) => fromStorage(
        await api.jobsService.updateJob(params.jobId, body)
    ), { errorMessage: 'Could not update job' });

    registry.delete('/jobs/:jobId', {
        operationId: 'deleteJob',
        summary: 'Soft delete a job and its executions',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.JobRecordSchema,
    }, async ({ params }) => fromStorage(await api.jobsService.softDeleteJob(params.jobId)), {
        errorMessage: `Could not delete job`
    });

    // Actions

    registry.post('/jobs/:jobId/_start', {
        operationId: 'startJob',
        summary: 'Start a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.NewExecutionSchema,
    }, ({ params }) => api.jobsService.startJob(params.jobId), {
        errorMessage: ({ jobId }) => `Could not start job: ${jobId}`
    });

    registry.post('/jobs/:jobId/_stop', {
        operationId: 'stopJob',
        summary: 'Stop a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.StopJobQuerySchema,
        response: TerasliceApiV2.StopJobResultSchema,
    }, async ({ params, query: { timeout, blocking, force } }) => {
        const exId = await getLatestExId(params.jobId);

        await api.executionService.stopExecution(exId, { timeout, force });
        const status = await waitForStop(exId, blocking);

        if (force) {
            return {
                message: `Force stop complete for exId ${exId}`,
                status
            };
        }
        return { status };
    }, { errorMessage: 'Could not stop execution' });

    registry.post('/jobs/:jobId/_pause', {
        operationId: 'pauseJob',
        summary: 'Pause a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.PauseJobResultSchema,
    }, async ({ params }) => {
        const exId = await getLatestExId(params.jobId);
        return api.executionService.pauseExecution(exId);
    }, { errorMessage: 'Could not pause execution' });

    registry.post('/jobs/:jobId/_resume', {
        operationId: 'resumeJob',
        summary: 'Resume a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.ResumeJobResultSchema,
    }, async ({ params }) => {
        const exId = await getLatestExId(params.jobId);
        return api.executionService.resumeExecution(exId);
    }, { errorMessage: 'Could not resume execution' });

    registry.post('/jobs/:jobId/_workers', {
        operationId: 'changeJobWorkers',
        summary: 'Add, remove or set the workers of a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.ChangeJobWorkersQuerySchema,
        response: TerasliceApiV2.ChangeJobWorkersResultSchema,
    }, async ({ params, query }) => {
        const exId = await getLatestExId(params.jobId);
        const { executionService } = api;

        // the schema allows exactly one of these
        let result;
        if (query.add !== undefined) {
            result = await executionService.addWorkers(exId, query.add);
        } else if (query.remove !== undefined) {
            result = await executionService.removeWorkers(exId, query.remove);
        } else {
            result = await executionService.setWorkers(exId, query.total as number);
        }

        return {
            message: `${result.workerNum} workers have been ${result.action} for execution: ${result.ex_id}`
        };
    }, { errorMessage: 'Could not change workers count' });

    registry.post('/jobs/:jobId/_settings', {
        operationId: 'updateJobSettings',
        summary: 'Change settings of a running job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.UpdateJobSettingsQuerySchema,
        response: TerasliceApiV2.UpdateJobSettingsResultSchema,
    }, async ({ params, query: { log_level } }) => {
        const exId = await getLatestExId(params.jobId);
        await api.executionService.setLogLevel(exId, log_level);
        return { exId, level: log_level };
    }, { errorMessage: 'Could not update dynamic job settings' });

    registry.post('/jobs/:jobId/_active', {
        operationId: 'activateJob',
        summary: 'Mark a job as active',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.UpdatedJobSchema,
    }, async ({ params }) => fromStorage(
        await api.jobsService.setActiveState(params.jobId, true)
    ), { errorMessage: ({ jobId }) => `Could not change active to 'true' for job: ${jobId}` });

    registry.post('/jobs/:jobId/_inactive', {
        operationId: 'deactivateJob',
        summary: 'Mark a job as inactive',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.UpdatedJobSchema,
    }, async ({ params }) => fromStorage(
        await api.jobsService.setActiveState(params.jobId, false)
    ), { errorMessage: ({ jobId }) => `Could not change active to 'false' for job: ${jobId}` });

    registry.post('/jobs/:jobId/_recover', {
        operationId: 'recoverJob',
        summary: 'Recover a job\'s stopped or failed execution as a new execution',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.RecoverJobQuerySchema,
        response: TerasliceApiV2.NewExecutionSchema,
    }, async ({ params: { jobId }, query: { cleanup_type: cleanupType, ex_id: exId } }) => {
        if (!exId) {
            return api.jobsService.recoverJob(jobId, cleanupType);
        }

        const execution = await api.executionService.getExecutionContext(exId);
        if (execution.job_id !== jobId) {
            throw new TSError(`Execution ${exId} does not belong to job ${jobId}`, {
                statusCode: 400
            });
        }
        return api.executionService.recoverExecution(exId, cleanupType);
    }, { errorMessage: 'Could not recover job' });

    registry.get('/jobs/:jobId/ex', {
        operationId: 'getJobLatestExecution',
        summary: 'Get the latest execution of a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.ExecutionRecordSchema,
    }, async ({ params }) => fromStorage(await api.jobsService.getLatestExecution(params.jobId)), {
        errorMessage: 'Could not retrieve the latest execution'
    });

    registry.get('/jobs/:jobId/errors', {
        operationId: 'getJobErrors',
        summary: 'List the failed slices of a job\'s latest execution',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.GetJobErrorsQuerySchema,
        response: TerasliceApiV2.SliceErrorListSchema,
    }, async ({ params, query }) => {
        const exId = await getLatestExId(params.jobId);
        return searchErrors(exId, query);
    }, { errorMessage: 'Could not get errors for job' });

    registry.get('/jobs/:jobId/controller', {
        operationId: 'getJobController',
        summary: 'Get statistics for the execution controller of a job\'s latest execution',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.JobControllerStatsSchema,
    }, async ({ params }) => {
        const exId = await getLatestExId(params.jobId);
        return toControllerStatsResponse(await api.executionService.getControllerStats(exId));
    }, { errorMessage: 'Could not get controller statistics' });

    // `raw`: getSliceTap returns the JSON already serialized, with the
    // worker's records passed through unparsed
    registry.get('/jobs/:jobId/tap', {
        operationId: 'getJobTap',
        summary: 'Capture the records the next slice of a job\'s latest execution produces',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.GetJobTapQuerySchema,
        response: TerasliceApiV2.SliceTapResultSchema,
        raw: true,
    }, async ({ params, query: { size } }) => {
        const exId = await getLatestExId(params.jobId);
        // the slice tap takes 0 to mean every record
        return api.executionService.getSliceTap(exId, { size: size === 'all' ? 0 : size });
    }, { errorMessage: 'Could not get slice tap' });

    // Executions (read-only)

    registry.get('/ex', {
        operationId: 'getExecutions',
        summary: 'List executions',
        tags: ['Executions'],
        query: TerasliceApiV2.GetExecutionsQuerySchema,
        response: TerasliceApiV2.ExecutionRecordListSchema,
    }, async ({ query }) => {
        const { size, from } = query;
        const { job_id: jobId, deleted } = query;
        const sort = sortOrDefault(query.sort);
        const statuses = parseList(query.status);

        let partialQuery = 'ex_id:*';

        if (jobId) {
            partialQuery += ` AND job_id:"${jobId}"`;
        }

        if (statuses.length) {
            const statusTerms = statuses.map((s) => `_status:"${s}"`).join(' OR ');
            partialQuery += ` AND (${statusTerms})`;
        }

        partialQuery = addDeletedToQuery(`${deleted}`, partialQuery);
        const searchQuery = addFilterToQuery(partialQuery, query.filter ?? '');

        const executions = await api.executionStorage.search(searchQuery, from, size, sort);
        return executions.map((ex) => fromStorage(ex));
    }, { errorMessage: 'Could not retrieve list of execution contexts' });

    registry.get('/ex/:exId', {
        operationId: 'getExecution',
        summary: 'Get an execution',
        tags: ['Executions'],
        params: TerasliceApiV2.ExIdParams,
        response: TerasliceApiV2.ExecutionRecordSchema,
    }, async ({ params }) => fromStorage(
        await api.executionService.getExecutionContext(params.exId)
    ), { errorMessage: ({ exId }) => `Could not retrieve execution context ${exId}` });

    registry.get('/ex/:exId/errors', {
        operationId: 'getExecutionErrors',
        summary: 'List the failed slices of an execution',
        tags: ['Executions'],
        params: TerasliceApiV2.ExIdParams,
        query: TerasliceApiV2.GetExecutionErrorsQuerySchema,
        response: TerasliceApiV2.SliceErrorListSchema,
    }, ({ params, query }) => searchErrors(params.exId, query), {
        errorMessage: 'Could not get errors for execution'
    });

    return registry;
}
