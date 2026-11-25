import { generateJobJSONSchema } from '@terascope/job-components';
import {
    parseList, TSError, logError,
    pDelay, parseErrorInfo
} from '@terascope/core-utils';
import { type Logger, type ExecutionStatus, TerasliceApiV2 } from '@terascope/types';
import type { ApiService } from '../api.js';
import type { ControllerStats } from '../../../../../interfaces.js';
import type { RecordsWithTotal } from '../../../../storage/index.js';
import {
    createJobActiveQuery, addDeletedToQuery, addFilterToQuery, buildConnectorList
} from '../../../../utils/api_utils.js';
import { getPackageJSON } from '../../../../utils/file_utils.js';
import { byKeys, pageInMemory, toPage } from '../../../../utils/pagination.js';
import {
    createRouteRegistry, type RouteRegistry, type Parsed
} from '../../../../utils/v2_routes.js';
import {
    txtRouteSpec, toTextTable, mapRecords, sortOrDefault, pagedSearch
} from './route-utils.js';

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

/** Default columns of `GET /txt/jobs` */
const txtJobsColumns = ['job_id', 'name', 'active', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];

/** Default columns of `GET /txt/ex` */
const txtExecutionsColumns = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];

/** Default columns of `GET /txt/workers` per cluster type */
const txtWorkersColumns: Record<string, readonly string[]> = {
    native: ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'],
    kubernetesV2: ['assignment', 'job_id', 'ex_id', 'node_id', 'pod_name', 'image'],
};

/** Default columns of `GET /txt/nodes` */
const txtNodesColumns = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];

/** Default columns of `GET /txt/controllers` */
const txtControllersColumns = ['name', 'job_id', 'workers_available', 'workers_active', 'failed', 'queued', 'processed'];

/** With `deleted=true`, the jobs and executions tables add when each was deleted */
function withDeletedOn(columns: readonly string[], deleted: boolean): readonly string[] {
    return deleted ? [...columns, '_deleted_on'] : columns;
}

/**
 * Routes for the beta /v2 API. Mounted only at /v2, with no unversioned alias.
 * See https://github.com/terascope/teraslice/issues/4584
 */
export function createV2Registry(api: ApiService): RouteRegistry {
    const registry = createRouteRegistry();

    /*
     * The storage backend passes OpenSearch's 404 through, with a message like
     * "Response Error" that doesn't say what was missing. These helpers swap it
     * for one naming the job or execution. They live here rather than in the
     * storage classes so v1 responses don't change.
     */

    function isNotFound(err: unknown): boolean {
        return parseErrorInfo(err).statusCode === 404;
    }

    async function getJob(jobId: string) {
        try {
            return await api.jobsStorage.get(jobId);
        } catch (err) {
            if (isNotFound(err)) {
                throw new TSError(`Job "${jobId}" was not found`, { statusCode: 404 });
            }
            throw err;
        }
    }

    async function getExecution(exId: string) {
        try {
            return await api.executionService.getExecutionContext(exId);
        } catch (err) {
            if (isNotFound(err)) {
                throw new TSError(`Execution "${exId}" was not found`, { statusCode: 404 });
            }
            throw err;
        }
    }

    /**
     * Runs a JobsService call that looks the job up itself. On a 404, checks
     * whether the job exists: if not, throws the "Job was not found" error;
     * if it does, the 404 came from elsewhere (an asset lookup during
     * validation, say), so the original error is rethrown. This only adds a
     * lookup when the call has already failed.
     */
    async function withJob<T>(jobId: string, fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (err) {
            if (isNotFound(err)) await getJob(jobId);
            throw err;
        }
    }

    /**
     * The id of the job's latest execution. A 404 says whether the job is
     * missing or only has no executions.
     */
    async function getLatestExId(jobId: string): Promise<string> {
        const exId = await withJob(jobId, () => api.jobsService.getLatestExecutionId(jobId));

        if (!exId) {
            throw new TSError(`No execution was found for job ${jobId}`, {
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

    /*
     * The list functions return one page of records with the total, for a
     * JSON route or its /txt copy to wrap with `toPage()`. Each search runs
     * through `pagedSearch()`, so every caller gets the max_result_window
     * message.
     */

    async function listJobs(
        query: Parsed<typeof TerasliceApiV2.GetJobsQuerySchema>
    ): Promise<RecordsWithTotal<TerasliceApiV2.JobWithExecution>> {
        const { size, from } = query;
        const { active, deleted, ex } = query;
        const sort = sortOrDefault(query.sort);

        let partialQuery = createJobActiveQuery(active === undefined ? '' : `${active}`);
        partialQuery = addDeletedToQuery(`${deleted}`, partialQuery);
        const searchQuery = addFilterToQuery(partialQuery, query.filter ?? '');

        if (ex === undefined) {
            const jobs = await pagedSearch(
                () => api.jobsStorage.searchWithTotal({ query: searchQuery, from, size, sort })
            );
            return mapRecords(jobs, fromStorage);
        }

        // `?ex=` (no fields) includes the whole execution
        const fields = parseList(ex);
        const jobs = await pagedSearch(() => api.jobsService.getJobsWithExInfoAndTotal({
            query: searchQuery,
            from,
            size,
            sort,
            exFields: fields.length ? fields : undefined,
        }));
        return mapRecords(jobs, fromStorage);
    }

    async function listExecutions(
        query: Parsed<typeof TerasliceApiV2.GetExecutionsQuerySchema>
    ): Promise<RecordsWithTotal<TerasliceApiV2.ExecutionRecord>> {
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

        const executions = await pagedSearch(
            () => api.executionStorage.searchWithTotal({ query: searchQuery, from, size, sort })
        );
        return mapRecords(executions, fromStorage);
    }

    async function searchErrors(
        exId: string,
        { size, from, sort, filter }: Parsed<typeof TerasliceApiV2.GetJobErrorsQuerySchema>
    ): Promise<RecordsWithTotal<TerasliceApiV2.SliceStateRecord>> {
        const errorQuery = addFilterToQuery(`state:error AND ex_id:"${exId}"`, filter ?? '');
        // StateStorage returns the backend's untyped records, unlike
        // JobsStorage/ExecutionStorage, which cast to their record type
        const slices = await pagedSearch(
            () => api.stateStorage.searchWithTotal({
                query: errorQuery, from, size, sort: sortOrDefault(sort)
            })
        );
        return slices as RecordsWithTotal<TerasliceApiV2.SliceStateRecord>;
    }

    /**
     * Sorted by `ex_id`, so pages are stable while the set of controllers is.
     */
    async function listControllers(
        { from, size }: Parsed<typeof TerasliceApiV2.GetClusterControllersQuerySchema>
    ): Promise<RecordsWithTotal<TerasliceApiV2.ControllerStats>> {
        const stats = toControllerStatsResponse(await api.executionService.getControllerStats());
        return pageInMemory(stats, byKeys('ex_id'), from, size);
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
        query: TerasliceApiV2.GetClusterControllersQuerySchema,
        response: TerasliceApiV2.ControllerStatsPageSchema,
    }, async ({ query }) => toPage(await listControllers(query), query.from, query.size), {
        errorMessage: 'Could not get execution statistics'
    });

    // Jobs

    registry.get('/jobs', {
        operationId: 'getJobs',
        summary: 'List jobs',
        tags: ['Jobs'],
        query: TerasliceApiV2.GetJobsQuerySchema,
        response: TerasliceApiV2.JobWithExecutionPageSchema,
    }, async ({ query }) => toPage(await listJobs(query), query.from, query.size), {
        errorMessage: 'Could not retrieve list of jobs'
    });

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
        if (ex === undefined) return fromStorage(await getJob(jobId));

        // `?ex=` (no fields) includes the whole execution
        const fields = parseList(ex);
        const job = await withJob(jobId, () => api.jobsService.getJobWithExInfo(
            jobId, fields.length ? fields : undefined
        ));
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
        await withJob(params.jobId, () => api.jobsService.updateJob(params.jobId, body))
    ), { errorMessage: 'Could not update job' });

    registry.delete('/jobs/:jobId', {
        operationId: 'deleteJob',
        summary: 'Soft delete a job and its executions',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.JobRecordSchema,
    }, async ({ params }) => fromStorage(
        await withJob(params.jobId, () => api.jobsService.softDeleteJob(params.jobId))
    ), {
        errorMessage: `Could not delete job`
    });

    // Actions

    registry.post('/jobs/:jobId/_start', {
        operationId: 'startJob',
        summary: 'Start a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.NewExecutionSchema,
    }, ({ params }) => withJob(params.jobId, () => api.jobsService.startJob(params.jobId)), {
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
        await withJob(params.jobId, () => api.jobsService.setActiveState(params.jobId, true))
    ), { errorMessage: ({ jobId }) => `Could not change active to 'true' for job: ${jobId}` });

    registry.post('/jobs/:jobId/_inactive', {
        operationId: 'deactivateJob',
        summary: 'Mark a job as inactive',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.UpdatedJobSchema,
    }, async ({ params }) => fromStorage(
        await withJob(params.jobId, () => api.jobsService.setActiveState(params.jobId, false))
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
            return withJob(jobId, () => api.jobsService.recoverJob(jobId, cleanupType));
        }

        const execution = await getExecution(exId);
        if (execution.job_id !== jobId) {
            throw new TSError(`Execution ${exId} does not belong to job ${jobId}`, {
                statusCode: 400
            });
        }
        await api.jobsService.assertJobCanRun(jobId);
        return api.executionService.recoverExecution(execution, cleanupType);
    }, { errorMessage: 'Could not recover job' });

    registry.get('/jobs/:jobId/ex', {
        operationId: 'getJobLatestExecution',
        summary: 'Get the latest execution of a job',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        response: TerasliceApiV2.ExecutionRecordSchema,
    }, async ({ params }) => fromStorage(
        await withJob(params.jobId, () => api.jobsService.getLatestExecution(params.jobId))
    ), {
        errorMessage: 'Could not retrieve the latest execution'
    });

    registry.get('/jobs/:jobId/errors', {
        operationId: 'getJobErrors',
        summary: 'List the failed slices of a job\'s latest execution',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.GetJobErrorsQuerySchema,
        response: TerasliceApiV2.SliceErrorPageSchema,
    }, async ({ params, query }) => {
        const exId = await getLatestExId(params.jobId);
        return toPage(await searchErrors(exId, query), query.from, query.size);
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

    // `format: 'raw'`: getSliceTap returns the JSON already serialized, with the
    // worker's records passed through unparsed
    registry.get('/jobs/:jobId/tap', {
        operationId: 'getJobTap',
        summary: 'Capture the records the next slice of a job\'s latest execution produces',
        tags: ['Jobs'],
        params: TerasliceApiV2.JobIdParams,
        query: TerasliceApiV2.GetJobTapQuerySchema,
        response: TerasliceApiV2.SliceTapResultSchema,
        format: 'raw',
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
        response: TerasliceApiV2.ExecutionRecordPageSchema,
    }, async ({ query }) => toPage(await listExecutions(query), query.from, query.size), {
        errorMessage: 'Could not retrieve list of execution contexts'
    });

    registry.get('/ex/:exId', {
        operationId: 'getExecution',
        summary: 'Get an execution',
        tags: ['Executions'],
        params: TerasliceApiV2.ExIdParams,
        response: TerasliceApiV2.ExecutionRecordSchema,
    }, async ({ params }) => fromStorage(await getExecution(params.exId)), { errorMessage: ({ exId }) => `Could not retrieve execution context ${exId}` });

    registry.get('/ex/:exId/errors', {
        operationId: 'getExecutionErrors',
        summary: 'List the failed slices of an execution',
        tags: ['Executions'],
        params: TerasliceApiV2.ExIdParams,
        query: TerasliceApiV2.GetExecutionErrorsQuerySchema,
        response: TerasliceApiV2.SliceErrorPageSchema,
    }, async ({ params, query }) => {
        // 404 for an unknown execution rather than an empty page
        await getExecution(params.exId);
        return toPage(await searchErrors(params.exId, query), query.from, query.size);
    }, {
        errorMessage: 'Could not get errors for execution'
    });

    // Text tables.

    registry.get('/txt/jobs', {
        ...txtRouteSpec,
        operationId: 'getJobsTxtTable',
        summary: 'List jobs as a text table',
        query: TerasliceApiV2.GetTxtJobsQuerySchema,
    }, async ({ query }, req) => toTextTable(
        toPage(await listJobs(query), query.from, query.size),
        withDeletedOn(txtJobsColumns, query.deleted),
        query,
        req
    ), { errorMessage: 'Could not get all jobs' });

    registry.get('/txt/ex', {
        ...txtRouteSpec,
        operationId: 'getExecutionsTxtTable',
        summary: 'List executions as a text table',
        query: TerasliceApiV2.GetTxtExecutionsQuerySchema,
    }, async ({ query }, req) => toTextTable(
        toPage(await listExecutions(query), query.from, query.size),
        withDeletedOn(txtExecutionsColumns, query.deleted),
        query,
        req
    ), { errorMessage: 'Could not get all executions' });

    registry.get('/txt/workers', {
        ...txtRouteSpec,
        operationId: 'getWorkersTxtTable',
        summary: 'List the processes on every connected node as a text table, '
            + 'sorted by ex_id, assignment, then worker_id',
        query: TerasliceApiV2.GetTxtWorkersQuerySchema,
    }, ({ query }, req) => {
        const { from, size } = query;
        const workers = api.executionService.findAllWorkers();
        const page = pageInMemory(workers, byKeys('ex_id', 'assignment', 'worker_id'), from, size);
        const clusterType = api.context.sysconfig.teraslice.cluster_manager_type;

        return toTextTable(
            toPage(page, from, size), txtWorkersColumns[clusterType] ?? [], query, req
        );
    }, { errorMessage: 'Could not get all workers' });

    registry.get('/txt/nodes', {
        ...txtRouteSpec,
        operationId: 'getNodesTxtTable',
        summary: 'List the cluster\'s nodes as a text table, sorted by node_id. '
            + '`active` is the number of processes',
        query: TerasliceApiV2.GetTxtNodesQuerySchema,
    }, ({ query }, req) => {
        const { from, size } = query;
        const nodes = Object.values(api.clusterService.getClusterState());
        const page = mapRecords(
            pageInMemory(nodes, byKeys('node_id'), from, size),
            (node) => ({ ...node, active: node.active.length })
        );

        return toTextTable(toPage(page, from, size), txtNodesColumns, query, req);
    }, { errorMessage: 'Could not get all nodes' });

    registry.get('/txt/controllers', {
        ...txtRouteSpec,
        operationId: 'getControllersTxtTable',
        summary: 'List every running execution controller as a text table, sorted by ex_id',
        query: TerasliceApiV2.GetTxtControllersQuerySchema,
    }, async ({ query }, req) => toTextTable(
        toPage(await listControllers(query), query.from, query.size),
        txtControllersColumns,
        query,
        req
    ), { errorMessage: 'Could not get all execution statistics' });

    return registry;
}
