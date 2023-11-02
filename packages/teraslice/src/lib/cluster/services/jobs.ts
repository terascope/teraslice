import defaultsDeep from 'lodash/defaultsDeep';
import {
    TSError, uniq, cloneDeep,
    isEmpty, getTypeOf, isString,
    Logger
} from '@terascope/utils';
import { JobValidator, ValidatedJobConfig } from '@terascope/job-components';
import { ClusterMasterContext } from '../../../interfaces';
import { makeLogger } from '../../workers/helpers/terafoundation';
import { spawnAssetLoader } from '../../workers/assets/spawn';
import { terasliceOpPath } from '../../config';
import { JobsStorage, ExecutionStorage } from '../../storage';
import {} from './execution';

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
    executionService!: any;

    constructor(context: ClusterMasterContext) {
        this.context = context;
        this.logger = makeLogger(context, 'jobs_service');
        this.jobValidator = new JobValidator(context, {
            terasliceOpPath,
        });
    }

    async initialize() {
        this.logger.info('job service is initializing...');

        const { executionStorage, jobsStorage } = this.context.stores;
        if (jobsStorage == null || executionStorage == null) {
            throw new Error('Missing required stores');
        }

        const executionService = this.context.services.execution;

        if (executionService == null) {
            throw new Error('Missing required services');
        }

        this.jobsStorage = jobsStorage;
        this.executionStorage = executionStorage;
        this.jobsStorage = jobsStorage;
    }

    /**
     * Validate the job spec
     *
     * @returns {Promise<import('@terascope/job-components').ValidatedJobConfig>}
    */
    private async _validateJobSpec(
        jobSpec: Partial<ValidatedJobConfig>
    ): Promise<ValidatedJobConfig> {
        const parsedAssetJob = await this._ensureAssets(cloneDeep(jobSpec));
        const validJob = await this.jobValidator.validateConfig(parsedAssetJob);
        return validJob;
    }

    async submitJob(jobSpec: Partial<ValidatedJobConfig>, shouldRun?: boolean) {
        // @ts-expect-error TODO: should have job_id?
        if (jobSpec.job_id) {
            throw new TSError('Job cannot include a job_id on submit', {
                statusCode: 422,
            });
        }

        const validJob = await this._validateJobSpec(jobSpec);
        const job = await this.jobsStorage.create(jobSpec);
        if (!shouldRun) {
            return { job_id: job.job_id };
        }

        const exConfig = Object.assign({}, jobSpec, validJob, {
            job_id: job.job_id
        });
        return executionService.createExecutionContext(exConfig);
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

    async updateJob(jobId: string, jobSpec: any) {
        await this._validateJobSpec(jobSpec);
        const originalJob = await this.jobsStorage.get(jobId);
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
    async startJob(jobId) {
        const activeExecution = await _getActiveExecution(jobId, true);

        // searching for an active execution, if there is then we reject
        if (activeExecution) {
            throw new TSError(`Job ${jobId} is currently running, cannot have the same job concurrently running`, {
                statusCode: 409
            });
        }

        const jobSpec = await this.jobsStorage.get(jobId);
        const validJob = await this._validateJobSpec(jobSpec);

        if (validJob.autorecover) {
            return _recoverValidJob(validJob);
        }

        return executionService.createExecutionContext(validJob);
    }

    /**
     * Recover a job using the valid configuration
     *
     * @private
     * @param {import('@terascope/job-components').ValidatedJobConfig} validJob
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {Promise<NewExecutionResult>}
    */
    private async _recoverValidJob(validJob, cleanupType) {
        const recoverFrom = await getLatestExecution(validJob.job_id, undefined, true);

        // if there isn't an execution and autorecover is true
        // create a new execution else throw
        if (!recoverFrom) {
            if (validJob.autorecover) {
                return executionService.createExecutionContext(validJob);
            }

            throw new TSError(`Job ${validJob.job_id} is missing an execution to recover from`, {
                statusCode: 404
            });
        }

        if (validJob.slicers !== recoverFrom.slicers) {
            const changedFrom = `from ${recoverFrom.slicers} to ${validJob.slicers}`;
            this.logger.warn(`recovery for job ${recoverFrom.job_id} changed slicers ${changedFrom}`);
        }

        return executionService.recoverExecution(
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
    async recoverJob(jobId, cleanupType) {
        // we need to do validations since the job config could change between recovery
        const jobSpec = await this.jobsStorage.get(jobId);
        const validJob = await this._validateJobSpec(jobSpec);
        return _recoverValidJob(validJob, cleanupType);
    }

    async pauseJob(jobId) {
        return getLatestExecutionId(jobId).then((exId) => executionService.pauseExecution(exId));
    }

    async resumeJob(jobId) {
        return getLatestExecutionId(jobId).then((exId) => executionService.resumeExecution(exId));
    }

    /**
     * Get the latest execution
     *
     * @param {string} jobId
     * @param {string} [query]
     * @param {boolean=false} [allowZeroResults]
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    async getLatestExecution(jobId, query, allowZeroResults = false) {
        if (!jobId || !isString(jobId)) {
            throw new TSError(`Invalid job id, got ${getTypeOf(jobId)}`);
        }

        const ex = await exStore.search(
            query || `job_id: "${jobId}"`, null, 1, '_created:desc'
        );

        if (!allowZeroResults && !ex.length) {
            throw new TSError(`No execution was found for job ${jobId}`, {
                statusCode: 404
            });
        }
        return ex[0];
    }

    /**
     * Get the active execution
     *
     * @param {string} jobId
     * @param {boolean} [allowZeroResults]
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    private async _getActiveExecution(jobId, allowZeroResults) {
        const str = exStore
            .getTerminalStatuses()
            .map((state) => ` _status:"${state}"`)
            .join(' OR ');
        const query = `job_id:"${jobId}" AND _context:ex NOT (${str.trim()})`;
        return getLatestExecution(jobId, query, allowZeroResults);
    }

    /**
     * Get the active execution
     *
     * @param {string} jobId
     * @param {boolean} [allowZeroResults]
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    private async _getActiveExecutionId(jobId) {
        return _getActiveExecution(jobId).then((ex) => ex.ex_id);
    }

    async getLatestExecutionId(jobId) {
        return getLatestExecution(jobId).then((ex) => ex.ex_id);
    }

    async shutdown() {

    }

    async addWorkers(jobId, workerCount) {
        const exId = await _getActiveExecutionId(jobId);
        return executionService.addWorkers(exId, workerCount);
    }

    async removeWorkers(jobId, workerCount) {
        const exId = await _getActiveExecutionId(jobId);
        return executionService.removeWorkers(exId, workerCount);
    }

    async setWorkers(jobId, workerCount) {
        const exId = await _getActiveExecutionId(jobId);
        return executionService.setWorkers(exId, workerCount);
    }

    private async _ensureAssets(jobConfig) {
        const jobAssets = uniq(jobConfig.assets || []);
        if (isEmpty(jobAssets)) {
            return cloneDeep(jobConfig);
        }
        // convert asset references to their id's
        const assetIds = await spawnAssetsLoader(jobAssets);
        if (!assetIds.length) {
            throw new Error(`no asset id's were found for assets: ${JSON.stringify(jobAssets)}`);
        }

        if (jobAssets.length !== assetIds.length) {
            throw new Error(`job specified ${jobAssets.length} assets: ${jobAssets.assets} but only ${assetIds.length} where found, assets: ${assetIds}`);
        }

        // need to normalize asset identifiers to their id form
        // but not mutate original job_spec
        const parsedAssetJob = cloneDeep(jobConfig);
        parsedAssetJob.assets = assetIds;
        return parsedAssetJob;
    }
}
