import { RecoveryCleanupType, generateJobJSONSchema } from '@terascope/job-components';
import { parseList, TSError } from '@terascope/core-utils';
import { getClusterConnectorsDef } from '@terascope/types';
import { type ApiService, validateCleanupType, validateGetDeletedOption } from './api.js';
import type { TerasliceRequest } from '../../../interfaces.js';
import {
    sendError, handleTerasliceRequest, getSearchOptions,
    createJobActiveQuery, addDeletedToQuery, addFilterToQuery,
    buildConnectorList, getSliceTapOptions
} from '../../utils/api_utils.js';
import { getPackageJSON } from '../../utils/file_utils.js';
import { createRouteRegistry, type RouteRegistry } from '../../utils/v2_routes.js';

const terasliceVersion = getPackageJSON().version;

/**
 * Routes for the beta /v2 API. Mounted only at /v2, with no unversioned alias.
 * See https://github.com/terascope/teraslice/issues/4584
 */
export function createV2Registry(api: ApiService): RouteRegistry {
    const registry = createRouteRegistry();
    // Routes not yet migrated to `register` are added to `v2routes` directly
    const { router: v2routes, register } = registry;

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

    v2routes.get('/', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res);
        requestHandler(() => ({
            arch: api.context.arch,
            clustering_type: api.context.sysconfig.teraslice.cluster_manager_type,
            name: api.context.sysconfig.teraslice.name,
            node_version: process.version,
            platform: api.context.platform,
            teraslice_version: `v${terasliceVersion}`
        }));
    });

    v2routes.get('/cluster/state', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res);
        requestHandler(() => api.clusterService.getClusterState());
    });

    register(getClusterConnectorsDef, ({ query }) => ({
        connectors: buildConnectorList(api.context.sysconfig, query)
    }));

    v2routes.get('/cluster/job-schema', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res);
        requestHandler(() => ({
            version: terasliceVersion,
            job_schema: generateJobJSONSchema(api.context)
        }));
    });

    v2routes.get('/cluster/stats', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not get cluster statistics');
        requestHandler(() => api.executionService.getClusterAnalytics());
    });

    v2routes.get('/cluster/controllers', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not get execution statistics');
        requestHandler(() => api.executionService.getControllerStats());
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

    v2routes.get('/jobs/:jobId', (req, res) => {
        const { ex } = req.query;
        const { jobId } = req.params;

        const requestHandler = handleTerasliceRequest(req, res, 'Could not retrieve job');
        requestHandler(() => (typeof ex === 'string'
            ? api.jobsService.getJobWithExInfo(jobId, ex.split(','))
            : api.jobsStorage.get(jobId)));
    });

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

    v2routes.get('/jobs/:jobId/ex', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not retrieve list of execution contexts');
        requestHandler(() => api.jobsService.getLatestExecution(req.params.jobId));
    });

    v2routes.get('/jobs/:jobId/errors', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not get errors for job');
        requestHandler(async () => {
            const exId = await getLatestExId(req.params.jobId);
            return searchErrors(exId, req);
        });
    });

    v2routes.get('/jobs/:jobId/controller', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not get controller statistics');
        requestHandler(async () => {
            const exId = await getLatestExId(req.params.jobId);
            return api.executionService.getControllerStats(exId);
        });
    });

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

    v2routes.get('/ex/:exId', (req, res) => {
        const { exId } = req.params;
        const requestHandler = handleTerasliceRequest(req, res, `Could not retrieve execution context ${exId}`);
        requestHandler(() => api.executionService.getExecutionContext(exId));
    });

    v2routes.get('/ex/:exId/errors', (req, res) => {
        const requestHandler = handleTerasliceRequest(req, res, 'Could not get errors for execution');
        requestHandler(() => searchErrors(req.params.exId, req));
    });

    return registry;
}
