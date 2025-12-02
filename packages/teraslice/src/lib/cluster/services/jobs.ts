import {
    TSError, uniq, cloneDeep,
    isEmpty, getTypeOf, isString,
    Logger, defaultsDeep, makeISODate
} from '@terascope/core-utils';
import {
    JobConfigParams, JobValidator, RecoveryCleanupType,
    ValidatedJobConfig, parseName
} from '@terascope/job-components';
import { JobConfig, ExecutionConfig } from '@terascope/types';
import { ClusterMasterContext } from '../../../interfaces.js';
import { makeLogger } from '../../workers/helpers/terafoundation.js';
import { spawnAssetLoader } from '../../workers/assets/spawn.js';
import { JobsStorage, ExecutionStorage } from '../../storage/index.js';
import type { ExecutionService } from './execution.js';

/**
 * New execution result
 * @typedef NewExecutionResult
 * @property {string} job_id
 * @property {string} ex_id
 */

export class JobsService {
    context: ClusterMasterContext;
    jobValidator: JobValidator;
    logger: Logger;
    jobsStorage!: JobsStorage;
    executionStorage!: ExecutionStorage;
    executionService!: ExecutionService;

    constructor(context: ClusterMasterContext) {
        this.context = context;
        this.logger = makeLogger(context, 'jobs_service');
        this.jobValidator = new JobValidator(context);
    }

    async initialize() {
        this.logger.info('job service is initializing...');

        const { executionStorage, jobsStorage } = this.context.stores;
        if (jobsStorage == null || executionStorage == null) {
            throw new Error('Missing required stores');
        }

        const { executionService } = this.context.services;

        if (executionService == null) {
            throw new Error('Missing required services');
        }

        this.jobsStorage = jobsStorage;
        this.executionStorage = executionStorage;
        this.executionService = executionService;
    }

    /**
     * Validate the job spec
     *
     * @returns {Promise<import('@terascope/job-components').ValidatedJobConfig>}
    */
    private async _validateJobSpec(
        jobSpec: Partial<JobConfig | JobConfigParams>
    ): Promise<ValidatedJobConfig | JobConfig> {
        const parsedAssetJob = await this._ensureAssets(cloneDeep(jobSpec));
        const validJob = await this.jobValidator.validateConfig(parsedAssetJob);
        return validJob;
    }

    async submitJob(jobSpec: Partial<JobConfig | JobConfigParams>, shouldRun?: boolean) {
        // @ts-expect-error
        if (jobSpec.job_id) {
            throw new TSError('Job cannot include a job_id on submit', {
                statusCode: 422,
            });
        }

        this.addExternalPortsToJobSpec(jobSpec);
        const validJob = await this._validateJobSpec(jobSpec);

        // We don't create with the fully parsed validJob as it changes the asset names
        // to their asset id which we don't want stored as at the job level
        const job = await this.jobsStorage.create(jobSpec as ValidatedJobConfig);

        if (!shouldRun) {
            return { job_id: job.job_id };
        }

        const jobRecord = Object.assign({}, jobSpec, validJob, {
            job_id: job.job_id
        }) as JobConfig;

        return this.executionService.createExecutionContext(jobRecord);
    }

    /**
     * Sets the `active` property on the job to `true` or `false`.
     * @param {string} jobId
     * @param {boolean} activeState
     */
    async setActiveState(jobId: string, activeState: boolean) {
        const job = await this.jobsStorage.get(jobId);
        if (activeState === true) {
            job.active = true;
        } else {
            job.active = false;
        }
        this.logger.info(`Setting jobId: ${jobId} to active: ${activeState}`);
        return this.updateJob(jobId, job);
    }

    async updateJob(jobId: string, jobSpec: Partial<JobConfig | JobConfigParams>) {
        const originalJob = await this.jobsStorage.get(jobId);

        if (originalJob._deleted === true) {
            throw new TSError(`Job ${jobId} has been deleted and cannot be updated.`, {
                statusCode: 410
            });
        }
        // If job is switching from active to inactive job validation is skipped
        // This allows for old jobs that are missing required resources to be marked inactive
        if (originalJob.active !== false && jobSpec.active === false) {
            this.logger.info(`Skipping job validation to set jobId ${jobId} as _inactive`);
        } else {
            this.addExternalPortsToJobSpec(jobSpec);
            await this._validateJobSpec(jobSpec);
        }

        return this.jobsStorage.update(jobId, Object.assign({}, jobSpec, {
            _created: originalJob._created
        }));
    }

    /**
     * Start a Job
     *
     * @param {string} jobId
     * @returns {Promise<NewExecutionResult>}
    */
    async startJob(jobId: string) {
        const activeExecution = await this._getActiveExecution(jobId, true);

        // searching for an active execution, if there is then we reject
        if (activeExecution) {
            throw new TSError(`Job ${jobId} is currently running, cannot have the same job concurrently running`, {
                statusCode: 409
            });
        }

        const currentResources = await this.executionService.listResourcesForJobId(jobId);

        if (currentResources.length > 0) {
            const flattenedResources = currentResources.flat();
            const exIdsSet = new Set<string>();
            for (const resource of flattenedResources) {
                if (resource.metadata.labels) {
                    exIdsSet.add(resource.metadata.labels['teraslice.terascope.io/exId']);
                }
            }
            const exIdsArr = Array.from(exIdsSet);
            const exIdsString = exIdsArr.join(', ');
            throw new TSError(`There are orphaned resources for job: ${jobId}, exId: ${exIdsString}.
            Please wait for Kubernetes to clean up orphaned resources.`);
        }

        const jobSpec = await this.jobsStorage.get(jobId);

        if (jobSpec._deleted === true) {
            throw new TSError(`Job ${jobId} has been deleted and cannot be started.`, {
                statusCode: 410
            });
        }

        const validJob = await this._validateJobSpec(jobSpec) as JobConfig;

        if (validJob.autorecover) {
            return this._recoverValidJob(validJob);
        }

        return this.executionService.createExecutionContext(validJob);
    }

    /**
     * Recover a job using the valid configuration
     *
     * @private
     * @param {import('@terascope/job-components').ValidatedJobConfig} validJob
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {Promise<NewExecutionResult>}
    */
    private async _recoverValidJob(validJob: JobConfig, cleanupType?: RecoveryCleanupType) {
        const recoverFrom = await this.getLatestExecution(validJob.job_id, undefined, true);

        // if there isn't an execution and autorecover is true
        // create a new execution else throw
        if (!recoverFrom) {
            if (validJob.autorecover) {
                return this.executionService.createExecutionContext(validJob);
            }

            throw new TSError(`Job ${validJob.job_id} is missing an execution to recover from`, {
                statusCode: 404
            });
        }

        if (validJob.slicers !== recoverFrom.slicers) {
            const changedFrom = `from ${recoverFrom.slicers} to ${validJob.slicers}`;
            this.logger.warn(`recovery for job ${recoverFrom.job_id} changed slicers ${changedFrom}`);
        }

        return this.executionService.recoverExecution(
            // apply the latest job config changes
            defaultsDeep({}, validJob, recoverFrom),
            cleanupType
        );
    }

    /**
     * Recover a job, applied the last changes to the prev execution
     *
     * @param {string} jobId
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {Promise<NewExecutionResult>}
    */
    async recoverJob(jobId: string, cleanupType: RecoveryCleanupType) {
        // we need to do validations since the job config could change between recovery
        const jobSpec = await this.jobsStorage.get(jobId);

        if (jobSpec._deleted === true) {
            throw new TSError(`Job ${jobId} has been deleted and cannot be recovered.`, {
                statusCode: 410
            });
        }

        const validJob = await this._validateJobSpec(jobSpec) as JobConfig;

        return this._recoverValidJob(validJob, cleanupType);
    }

    async pauseJob(jobId: string) {
        const exId = await this.getLatestExecutionId(jobId);
        return this.executionService.pauseExecution(exId);
    }

    async resumeJob(jobId: string) {
        const exId = await this.getLatestExecutionId(jobId);
        return this.executionService.resumeExecution(exId);
    }

    async softDeleteJob(jobId: string) {
        const activeExecution = await this._getActiveExecution(jobId, true);

        // searching for an active execution, if there is then we reject
        if (activeExecution) {
            throw new TSError(`Job ${jobId} is currently running, cannot delete a running job.`, {
                statusCode: 409
            });
        }

        // This will return any orphaned resources in k8s clustering
        // or an empty array in native clustering
        const currentResources = await this.executionService.listResourcesForJobId(jobId);

        if (currentResources.length > 0) {
            const flattenedResources = currentResources.flat();
            const exIdsSet = new Set<string>();
            for (const resource of flattenedResources) {
                if (resource.metadata.labels) {
                    exIdsSet.add(resource.metadata.labels['teraslice.terascope.io/exId']);
                }
            }
            const exIdsArr = Array.from(exIdsSet);
            const exIdsString = exIdsArr.join(', ');
            this.logger.info(`There are orphaned resources for job: ${jobId}, exId: ${exIdsString}.\n`
                + 'Removing resources before job deletion.');
            await Promise.all(exIdsArr
                .map((exId) => this.executionService.stopExecution(exId, { force: true }))
            );
        }

        const jobSpec = await this.jobsStorage.get(jobId);

        if (jobSpec._deleted === true) {
            throw new TSError(`Job ${jobId} has already been deleted.`, {
                statusCode: 410
            });
        }

        jobSpec._deleted = true;
        jobSpec._deleted_on = makeISODate();
        jobSpec.active = false;

        const executions = await this.getAllExecutions(jobId, undefined, true);
        for (const execution of executions) {
            await this.executionService.softDeleteExecutionContext(execution.ex_id);
        }
        return this.jobsStorage.update(jobId, jobSpec);
    }

    /**
     * Get all executions related to a jobId
     *
     * @param {string} jobId
     * @param {string} [query]
     * @param {boolean=false} [allowZeroResults]
     * @returns {Promise<import('@terascope/types').ExecutionConfig[]>}
     */
    async getAllExecutions(
        jobId: string,
        query?: string,
        allowZeroResults = false
    ): Promise<ExecutionConfig[]> {
        if (!jobId || !isString(jobId)) {
            throw new TSError(`Invalid job id, got ${getTypeOf(jobId)}`);
        }

        const executions = await this.executionStorage.search(
            query || `job_id: "${jobId}"`, undefined, undefined, '_created:desc'
        ) as ExecutionConfig[];

        if (!allowZeroResults && !executions.length) {
            throw new TSError(`No executions were found for job ${jobId}`, {
                statusCode: 404
            });
        }

        return executions;
    }

    /**
     * Get the latest execution
     *
     * @param {string} jobId
     * @param {string} [query]
     * @param {boolean=false} [allowZeroResults]
     * @returns {Promise<import('@terascope/types').ExecutionConfig>}
    */
    async getLatestExecution(
        jobId: string,
        query?: string,
        allowZeroResults = false
    ): Promise<ExecutionConfig> {
        if (!jobId || !isString(jobId)) {
            throw new TSError(`Invalid job id, got ${getTypeOf(jobId)}`);
        }

        const ex = await this.executionStorage.search(
            query || `job_id: "${jobId}"`, undefined, 1, '_created:desc'
        ) as ExecutionConfig[];

        if (!allowZeroResults && !ex.length) {
            throw new TSError(`No execution was found for job ${jobId}`, {
                statusCode: 404
            });
        }

        return ex[0];
    }

    /**
     * Get the job with the latest ex status
     *
     * @param {string} jobId
     * @param {string} [fields]
     * @returns {Promise<JobConfig>}
    */
    async getJobWithExInfo(
        jobId: string,
        fields?: string[],
    ): Promise<JobConfig> {
        if (!jobId || !isString(jobId)) {
            throw new TSError(`Invalid job id, got ${getTypeOf(jobId)}`);
        }

        const job = await this.jobsStorage.get(jobId);

        const ex = await this.executionStorage.search(
            `job_id: "${jobId}"`, undefined, 1, '_created:desc', fields || undefined
        ) as ExecutionConfig[];

        if (!ex.length || ex[0]._deleted === true) {
            job.ex = {};
            return job;
        }

        job.ex = ex[0];

        return job;
    }

    /**
     * Get a list of jobs with the latest ex status for each one
     *
     * @param {string} query
     * @param {number} from
     * @param {number} size
     * @param {string} sort
     * @param {string} [ex_fields]
     * @returns {Promise<JobConfig>}
    */
    async getJobsWithExInfo(
        query: string | Record<string, any>,
        from?: number,
        size?: number,
        sort?: string,
        ex_fields?: string[]
    ): Promise<JobConfig[]> {
        const jobList = await this.jobsStorage.search(query, from, size, sort);
        const finalList: JobConfig[] = [];
        for (const job of jobList) {
            finalList.push(await this.getJobWithExInfo(job.job_id, ex_fields));
        }
        return finalList;
    }

    /**
     * Get the active execution
     *
     * @param {string} jobId
     * @param {boolean} [allowZeroResults]
     * @returns {Promise<import('@terascope/types').ExecutionConfig>}
    */
    private async _getActiveExecution(jobId: string, allowZeroResults?: boolean) {
        const statuses = this.executionStorage
            .getTerminalStatuses()
            .map((state) => ` _status:"${state}"`)
            .join(' OR ');

        const query = `job_id:"${jobId}" AND _context:ex NOT (${statuses.trim()})`;

        return this.getLatestExecution(jobId, query, allowZeroResults);
    }

    /**
     * Get the active execution
     *
     * @param {string} jobId
     * @returns {Promise<string>}
    */
    private async _getActiveExecutionId(jobId: string): Promise<string> {
        const { ex_id } = await this._getActiveExecution(jobId);
        return ex_id;
    }

    async getLatestExecutionId(jobId: string): Promise<string> {
        const { ex_id } = await this.getLatestExecution(jobId);
        return ex_id;
    }

    async shutdown() {

    }

    async addWorkers(jobId: string, workerCount: number) {
        const exId = await this._getActiveExecutionId(jobId);
        return this.executionService.addWorkers(exId, workerCount);
    }

    async removeWorkers(jobId: string, workerCount: number) {
        const exId = await this._getActiveExecutionId(jobId);
        return this.executionService.removeWorkers(exId, workerCount);
    }

    async setWorkers(jobId: string, workerCount: number) {
        const exId = await this._getActiveExecutionId(jobId);
        return this.executionService.setWorkers(exId, workerCount);
    }

    private async _ensureAssets(jobConfig: Partial<JobConfig | JobConfigParams>) {
        const jobAssets = uniq(jobConfig.assets || []) as string [];

        if (isEmpty(jobAssets)) {
            return cloneDeep(jobConfig);
        }
        // convert asset references to their id's
        const assetIds = await spawnAssetLoader(jobAssets);
        if (!assetIds.length) {
            throw new Error(`no asset id's were found for assets: ${JSON.stringify(jobAssets)}`);
        }

        if (jobAssets.length !== assetIds.length) {
            throw new Error(`job specified ${jobAssets.length} assets: ${jobConfig.assets} but only ${assetIds.length} where found, assets: ${assetIds}`);
        }

        // need to normalize asset identifiers to their id form
        // but not mutate original job_spec
        const parsedAssetJob = cloneDeep(jobConfig);
        parsedAssetJob.assets = assetIds;

        const assetMapping = new Map<string, string>();

        for (let i = 0; i < jobAssets.length; i++) {
            assetMapping.set(jobAssets[i], assetIds[i]);
        }

        this.adjustNamesByAsset(parsedAssetJob as any, assetMapping);

        return parsedAssetJob;
    }

    private adjustNamesByAsset(
        jobConfig: ValidatedJobConfig,
        dict: Map<string, string>
    ) {
        jobConfig.operations = jobConfig.operations.map((op) => {
            if (op._api_name?.includes('@')) {
                const { name, assetIdentifier, tag } = parseName(op._api_name);
                const hashId = dict.get(assetIdentifier as string);

                if (!hashId) {
                    throw new Error(`Invalid operation _api_name for _op: ${name}, could not find the hashID for asset identifier ${assetIdentifier}`);
                }

                let hashedName = `${name}@${hashId}`;

                if (tag) {
                    hashedName = `${hashedName}:${tag}`;
                }

                op._api_name = hashedName;
            }

            if (op._op.includes('@')) {
                const { name, assetIdentifier } = parseName(op._op);
                const hashId = dict.get(assetIdentifier as string);

                if (!hashId) {
                    throw new Error(`Invalid operation name for _op: ${name}, could not find the hashID for asset identifier ${assetIdentifier}`);
                }

                op._op = `${name}@${hashId}`;
                return op;
            } else {
                return op;
            }
        });

        if (jobConfig.apis) {
            jobConfig.apis = jobConfig.apis.map((api) => {
                if (api._name.includes('@')) {
                    const { name, assetIdentifier, tag } = parseName(api._name);
                    const hashId = dict.get(assetIdentifier as string);

                    if (!hashId) {
                        throw new Error(`Invalid api name for _name: ${name}, could not find the hashID for asset identifier ${assetIdentifier}`);
                    }

                    let hashedName = `${name}@${hashId}`;

                    if (tag) {
                        hashedName = `${hashedName}:${tag}`;
                    }
                    api._name = hashedName;
                    return api;
                } else {
                    return api;
                }
            });
        }
    }

    /**
     * Automatically add external_ports to jobSpec if needed.
     * This ensures that the Prometheus exporter server can be scraped.
     * Check if prom_metrics_enabled is true on jobSpec or teraslice config.
     * If so, add or update external_ports property with correct port.
     * @param {Partial<JobConfig>} jobSpec
    */
    addExternalPortsToJobSpec(jobSpec: Partial<JobConfig>) {
        const {
            prom_metrics_enabled: enabledInTF,
            prom_metrics_port: tfPort
        } = this.context.sysconfig.terafoundation;
        const { prom_metrics_enabled: enabledInJob, prom_metrics_port: jobPort } = jobSpec;
        const portToUse: number = jobPort || tfPort;

        if (enabledInJob === true || (enabledInJob === undefined && enabledInTF)) {
            let portPresent = false;
            if (!jobSpec.external_ports) {
                jobSpec.external_ports = [];
            }
            for (const item of jobSpec.external_ports) {
                const currentPort = typeof item === 'number' ? item : item.port;
                if (currentPort === portToUse) portPresent = true;
            }
            if (!portPresent) {
                jobSpec.external_ports.push({ name: 'metrics', port: portToUse });
            }
        }
    }
}
