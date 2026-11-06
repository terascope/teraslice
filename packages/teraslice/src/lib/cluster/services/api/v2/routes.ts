import { RecoveryCleanupType, generateJobJSONSchema } from '@terascope/job-components';
import { parseList, TSError } from '@terascope/core-utils';
import {
    ClusterInfoSchema, ClusterStateSchema, ClusterStatsSchema, ControllerStatsListSchema,
    ConnectorListResponseSchema, ExecutionRecordSchema, ExIdParams,
    GetClusterConnectorsQuerySchema, GetJobQuerySchema, JobControllerStatsSchema, JobIdParams,
    JobSchemaResponseSchema, JobWithExecutionSchema,
    type ControllerStatsList, type Logger
} from '@terascope/types';
import { type ApiService, validateCleanupType, validateGetDeletedOption } from '../api.js';
import type { ControllerStats, TerasliceRequest } from '../../../../../interfaces.js';
import {
    sendError, handleTerasliceRequest, getSearchOptions,
    createJobActiveQuery, addDeletedToQuery, addFilterToQuery,
    buildConnectorList, getSliceTapOptions
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
): ControllerStatsList {
    return stats.map((stat) => ({
        ...stat,
        started: stat.started as string | undefined,
        queuing_complete: stat.queuing_complete as string | undefined,
    }));
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

    async function searchErrors(exId: string, req: TerasliceRequest) {
        const { size, from, sort, filter } = getSearchOptions(req);
        const errorQuery = addFilterToQuery(`state:error AND ex_id:"${exId}"`, filter as string);
        return api.stateStorage.search(errorQuery, from, size, sort as string);
    }

    // Cluster

    registry.get('/', {
        operationId: 'getClusterInfo',
        summary: 'Get cluster and version information',
        tags: ['Cluster'],
        response: ClusterInfoSchema,
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
        response: ClusterStateSchema,
    }, () => api.clusterService.getClusterState());

    registry.get('/cluster/connectors', {
        operationId: 'getClusterConnectors',
        summary: 'List the configured connectors',
        tags: ['Cluster'],
        query: GetClusterConnectorsQuerySchema,
        response: ConnectorListResponseSchema,
    }, ({ query }) => ({
        connectors: buildConnectorList(api.context.sysconfig, query)
    }));

    registry.get('/cluster/job-schema', {
        operationId: 'getClusterJobSchema',
        summary: 'Get the JSON Schema for job configs on this cluster',
        tags: ['Cluster'],
        response: JobSchemaResponseSchema,
    }, () => ({
        version: terasliceVersion,
        job_schema: generateJobJSONSchema(api.context)
    }));

    registry.get('/cluster/stats', {
        operationId: 'getClusterStats',
        summary: 'Get slice and worker stats across all executions',
        tags: ['Cluster'],
        response: ClusterStatsSchema,
    }, () => api.executionService.getClusterAnalytics(), {
        errorMessage: 'Could not get cluster statistics'
    });

    registry.get('/cluster/controllers', {
        operationId: 'getClusterControllers',
        summary: 'Get statistics for every running execution controller',
        tags: ['Cluster'],
        response: ControllerStatsListSchema,
    }, async () => toControllerStatsResponse(await api.executionService.getControllerStats()), {
        errorMessage: 'Could not get execution statistics'
    });

    // Jobs

    v2routes.get('/jobs', (req, res) => {
        const { active = '', deleted = 'false', ex } = req.query;
        const { size, from, sort, filter } = getSearchOptions(req);

        const requestHandler = handleTerasliceRequest(req, res, 'Could not retrieve list of jobs');
        requestHandler(() => {
            validateGetDeletedOption(deleted as string);

            let partialQuery = createJobActiveQuery(active as string);
            partialQuery = addDeletedToQuery(deleted as string, partialQuery);
            const query = addFilterToQuery(partialQuery, filter as string);

            return typeof ex === 'string'
                ? api.jobsService.getJobsWithExInfo(query, from, size, sort as string, ex.split(','))
                : api.jobsStorage.search(query, from, size, sort as string);
        });
    });

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
        params: JobIdParams,
        query: GetJobQuerySchema,
        response: JobWithExecutionSchema,
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
        params: JobIdParams,
        response: ExecutionRecordSchema,
    }, async ({ params }) => fromStorage(await api.jobsService.getLatestExecution(params.jobId)), {
        errorMessage: 'Could not retrieve the latest execution'
    });

    v2routes.get('/jobs/:jobId/errors', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not get errors for job');
        requestHandler(async () => {
            const exId = await getLatestExId(req.params.jobId);
            return searchErrors(exId, req);
        });
    });

    registry.get('/jobs/:jobId/controller', {
        operationId: 'getJobController',
        summary: 'Get statistics for the execution controller of a job\'s latest execution',
        tags: ['Jobs'],
        params: JobIdParams,
        response: JobControllerStatsSchema,
    }, async ({ params }) => {
        const exId = await getLatestExId(params.jobId);
        return toControllerStatsResponse(await api.executionService.getControllerStats(exId));
    }, { errorMessage: 'Could not get controller statistics' });

    v2routes.get('/jobs/:jobId/tap', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not get slice tap');
        requestHandler(async () => {
            const options = getSliceTapOptions(req.query);
            const exId = await getLatestExId(req.params.jobId);
            const body = await api.executionService.getSliceTap(exId, options);
            // set Content-Type to JSON so body is properly converted from buffer
            res.type('json');
            return body;
        });
    });

    // Executions (read-only)

    v2routes.get('/ex', (req, res) => {
        const { status = '', deleted = 'false', job_id: jobId } = req.query;
        const { size, from, sort, filter } = getSearchOptions(req);

        const requestHandler = handleTerasliceRequest(req, res, 'Could not retrieve list of execution contexts');
        requestHandler(() => {
            validateGetDeletedOption(deleted as string);
            const statuses = parseList(status);

            let partialQuery = 'ex_id:*';

            if (typeof jobId === 'string' && jobId) {
                partialQuery += ` AND job_id:"${jobId}"`;
            }

            if (statuses.length) {
                const statusTerms = statuses.map((s) => `_status:"${s}"`).join(' OR ');
                partialQuery += ` AND (${statusTerms})`;
            }

            partialQuery = addDeletedToQuery(deleted as string, partialQuery);
            const query = addFilterToQuery(partialQuery, filter as string);

            return api.executionStorage.search(query, from, size, sort as string);
        });
    });

    registry.get('/ex/:exId', {
        operationId: 'getExecution',
        summary: 'Get an execution',
        tags: ['Executions'],
        params: ExIdParams,
        response: ExecutionRecordSchema,
    }, async ({ params }) => fromStorage(
        await api.executionService.getExecutionContext(params.exId)
    ), { errorMessage: 'Could not retrieve execution' });

    v2routes.get('/ex/:exId/errors', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not get errors for execution');
        requestHandler(() => searchErrors(req.params.exId, req));
    });

    return registry;
}
