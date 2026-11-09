import { RecoveryCleanupType, generateJobJSONSchema } from '@terascope/job-components';
import { parseList, TSError } from '@terascope/core-utils';
import { type Logger, TerasliceApiV2 } from '@terascope/types';
import { type ApiService, validateCleanupType } from '../api.js';
import type { ControllerStats } from '../../../../../interfaces.js';
import {
    sendError, handleTerasliceRequest, createJobActiveQuery,
    addDeletedToQuery, addFilterToQuery, buildConnectorList
} from '../../../../utils/api_utils.js';
import { getPackageJSON } from '../../../../utils/file_utils.js';
import { createRouteRegistry, type RouteRegistry } from '../../../../utils/v2_routes.js';

const terasliceVersion = getPackageJSON().version;

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
    // Routes not yet migrated to the method helpers are added to `v2routes` directly
    const { router: v2routes } = registry;

    async function getLatestExId(jobId: string): Promise<string> {
        const exId = await api.jobsService.getLatestExecutionId(jobId);

        if (!exId) {
            throw new TSError(`No executions were found for job: ${jobId}`, {
                statusCode: 404
            });
        }
        return exId;
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

    v2routes.post('/jobs', (req, res) => {
        if (!req.body?.operations) {
            sendError(res, 400, 'No job was posted');
            return;
        }

        const shouldRun = `${req.query.start}` !== 'false';

        const requestHandler = handleTerasliceRequest(req, res, 'Job submission failed');
        requestHandler(() => api.jobsService.submitJob(req.body, shouldRun));
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

    v2routes.put('/jobs/:jobId', (req, res) => {
        const { jobId } = req.params;

        if (!req.body || Object.keys(req.body).length === 0) {
            sendError(res, 400, `no data was provided to update job ${jobId}`);
            return;
        }

        const requestHandler = handleTerasliceRequest(req, res, 'Could not update job');
        requestHandler(() => api.jobsService.updateJob(jobId, req.body));
    });

    v2routes.delete('/jobs/:jobId', (req, res) => {
        const { jobId } = req.params;
        const requestHandler = handleTerasliceRequest(req, res, 'Could not delete job');
        requestHandler(() => api.jobsService.softDeleteJob(jobId));
    });

    v2routes.post('/jobs/:jobId/_start', (req, res) => {
        const { jobId } = req.params;
        const requestHandler = handleTerasliceRequest(req, res, `Could not start job: ${jobId}`);
        requestHandler(() => api.jobsService.startJob(jobId));
    });

    v2routes.post('/jobs/:jobId/_stop', (req, res) => {
        const { jobId } = req.params;
        const { timeout, blocking, force } = req.query;
        const shouldForce = `${force}` === 'true';

        const requestHandler = handleTerasliceRequest(req, res, 'Could not stop execution');
        requestHandler(async () => {
            const exId = await getLatestExId(jobId);

            await api.executionService.stopExecution(exId, {
                timeout: timeout != null ? Number(timeout) : undefined,
                force: shouldForce
            });

            const status = await api._waitForStop(exId, `${blocking}` !== 'false');

            if (shouldForce) {
                return {
                    message: `Force stop complete for exId ${exId}`,
                    status: status.status
                };
            }
            return status;
        });
    });

    v2routes.post('/jobs/:jobId/_pause', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not pause execution');
        requestHandler(async () => {
            const exId = await getLatestExId(req.params.jobId);
            return api.executionService.pauseExecution(exId);
        });
    });

    v2routes.post('/jobs/:jobId/_resume', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not resume execution');
        requestHandler(async () => {
            const exId = await getLatestExId(req.params.jobId);
            return api.executionService.resumeExecution(exId);
        });
    });

    v2routes.post('/jobs/:jobId/_workers', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not change workers count');
        requestHandler(async () => {
            const exId = await getLatestExId(req.params.jobId);
            const result = await api._changeWorkers(exId, req.query);
            return { message: `${result.workerNum} workers have been ${result.action} for execution: ${result.ex_id}` };
        });
    });

    v2routes.post('/jobs/:jobId/_settings', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not update dynamic job settings');
        requestHandler(async () => {
            const exId = await getLatestExId(req.params.jobId);
            return api.executionService.setLogLevel(exId, req.query.log_level as string);
        });
    });

    v2routes.post('/jobs/:jobId/_active', (req, res) => {
        const { jobId } = req.params;
        const requestHandler = handleTerasliceRequest(req, res, `Could not change active to 'true' for job: ${jobId}`);
        requestHandler(() => api.jobsService.setActiveState(jobId, true));
    });

    v2routes.post('/jobs/:jobId/_inactive', (req, res) => {
        const { jobId } = req.params;
        const requestHandler = handleTerasliceRequest(req, res, `Could not change active to 'false' for job: ${jobId}`);
        requestHandler(() => api.jobsService.setActiveState(jobId, false));
    });

    v2routes.post('/jobs/:jobId/_recover', (req, res) => {
        const { jobId } = req.params;
        const cleanupType = req.query.cleanup_type as RecoveryCleanupType;
        const exId = req.query.ex_id as string | undefined;

        const requestHandler = handleTerasliceRequest(req, res, 'Could not recover job');
        requestHandler(async () => {
            validateCleanupType(cleanupType);

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
        });
    });

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
    ), { errorMessage: 'Could not retrieve execution' });

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
