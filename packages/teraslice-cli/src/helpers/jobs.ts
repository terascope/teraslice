import fs from 'fs-extra';
import {
    has, toString, pDelay, pMap
} from '@terascope/utils';
import {
    ExecutionStatus,
    Execution,
    ControllerState,
    Job
} from 'teraslice-client-js';
import { JobConfig } from '@terascope/job-components';
import TerasliceUtil from './teraslice-util';
import Display from '../helpers/display';
import reply from '../helpers/reply';

import {
    JobMetadata,
    StatusUpdate,
    RegisteredStatus
} from '../interfaces';

const display = new Display();

export default class Jobs {
    /**
     *
     * @param {object} cliConfig config object
     *
     */
    config: Record<string, any>;
    teraslice: TerasliceUtil;
    jobs: JobMetadata[];
    jobsListInitial: string[];
    allJobsStopped: boolean;
    activeStatus: string[];
    jobsListChecked: string[];
    terminalStatuses: (ExecutionStatus | RegisteredStatus)[];
    concurrency: number; // this should probably come from a config file?

    constructor(cliConfig: Record<string, any>) {
        this.config = cliConfig;
        this.teraslice = new TerasliceUtil(this.config);
        this.jobs = [];
        this.jobsListInitial = [];
        this.allJobsStopped = false;
        this.activeStatus = ['running', 'failing'];
        this.jobsListChecked = [];
        this.concurrency = 4;
        this.terminalStatuses = [
            ExecutionStatus.stopped,
            ExecutionStatus.completed,
            ExecutionStatus.terminated,
            ExecutionStatus.failed,
            ExecutionStatus.rejected,
            RegisteredStatus.no_execution
        ];
    }

    get list(): JobMetadata[] {
        return this.jobs;
    }

    async submitJobConfig(jobConfig: JobConfig) {
        try {
            return this.teraslice.client.jobs.submit(jobConfig, true);
        } catch (e) {
            reply.fatal(e);
        }
    }

    async status() {
        for (const job of this.jobs) {
            const { jobInfoString } = this.getJobIdentifiers(job);

            reply.green(`${jobInfoString} status: ${job.status}`);
        }
    }

    async initialize() {
        await this.getJobMetadata();
    }

    async view(): Promise<void> {
        for (const job of this.jobs) {
            const { jobInfoString } = this.getJobIdentifiers(job);

            reply.green(`${jobInfoString} config:\n`);

            reply.yellow(JSON.stringify(job.config, null, 4));
        }
    }

    async workers(): Promise<void> {
        for (const job of this.jobs) {
            const { jobInfoString, status } = this.getJobIdentifiers(job);

            if (this.terminalStatuses.includes(status as ExecutionStatus)) {
                reply.warning(`Cannot adjust workers for ${jobInfoString} because job status is ${status}`);
                return;
            }

            const response = await job.api.changeWorkers(
                this.config.args.action,
                this.config.args.number
            );

            const msg = typeof response === 'string' ? response : response.message;

            reply.green(`${jobInfoString}, ${msg}`);
        }
    }

    async recover(): Promise<void> {
        for (const job of this.jobs) {
            const { jobInfoString, status } = this.getJobIdentifiers(job);

            if (status !== ExecutionStatus.failed) {
                reply.warning(`${jobInfoString} status is ${status}, no need to recover`);
                continue;
            }

            try {
                const response = await job.api.recover();

                if (has(response, 'job_id')) {
                    reply.info(`Successfully recoverd ${jobInfoString}`);
                } else {
                    reply.info(toString(response));
                }
            } catch (e) {
                reply.fatal(e);
            }
        }
    }

    async error() {
        const opts = {
            from: this.config.args.from,
            sort: this.config.args.sort,
            size: this.config.args.size
        };
        const active = false;
        const parse = false;
        const header = ['ex_id', 'slice_id', 'slicer_id', 'slicer_order', 'state', 'ex_id', '_created', '_updated', 'error'];
        const format = `${this.config.args.output}Horizontal`;

        for (const job of this.jobs) {
            const { jobInfoString } = this.getJobIdentifiers(job);

            try {
                const response = await job.api.errors(opts);

                const rows = display.parseResponse(header, response ?? [], active);

                if (rows.length > 0) {
                    await display.display(header, rows, format, active, parse);
                } else {
                    reply.green(`No errors for ${jobInfoString}`);
                }
            } catch (e) {
                reply.fatal(e);
            }
        }
    }

    async awaitStatus(): Promise<void> {
        const wantedStatus = this.config.args.status;

        for (const job of this.jobs) {
            const { jobInfoString } = this.getJobIdentifiers(job);

            const statusUpdate = await this.waitStatusChange(job, wantedStatus);

            const newStatus = statusUpdate.newStatus!;

            if (statusUpdate.error === true) {
                reply.fatal(new Error(statusUpdate.errorMessage?.message));
            }

            if (wantedStatus.includes(newStatus)) {
                reply.green(`${jobInfoString} reached status: ${newStatus}`);
            } else {
                reply.fatal(`${jobInfoString} could not reach status ${wantedStatus.join(' or ')}`);
            }
        }
    }

    async save(): Promise<void> {
        const state: Record<string, any> = {};

        const jobIds = this.jobs.map((job) => job.id);

        reply.green(`Saving controller and execution state for ${jobIds.join(', ')} on ${this.config.args.clusterAlias}`);

        await pMap(
            this.jobs,
            (job) => this.addJobState(job, state),
            { concurrency: this.concurrency }
        );

        await fs.writeJson(this.config.jobStateFile, state, { spaces: 4 });

        reply.green(`Saved jobs state to ${this.config.jobStateFile}`);
    }

    private async addJobState(job: JobMetadata, state: Record<string, any>) {
        const [execution, [controller]] = await this.getJobState(job);

        state[job.id] = { execution, controller };
    }

    private async getJobState(job: JobMetadata): Promise<[Execution, ControllerState]> {
        try {
            return Promise.all([job.api.execution(), job.api.controller()]);
        } catch (e) {
            return reply.fatal(e.message);
        }
    }

    async resume(): Promise<void> {
        await this.startOrResumeJob('resume');
    }

    async run(): Promise<void> {
        await this.startOrResumeJob('start');
    }

    async start(): Promise<void> {
        await this.startOrResumeJob('start');
    }

    async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }

    async startOrResumeJob(action: 'start' | 'resume') {
        const func = action === 'start' ? '_start' : '_resume';

        const batches = this.batchJobsBeforeStart();

        for (const batch of batches) {
            await pMap(
                batch,
                (job) => this[func](job),
                { concurrency: batch.length }
            );
        }

        if ('watch' in this.config.args) {
            const slices = this.config.args.watch ?? 50;

            await pMap(
                this.jobs,
                (job) => this.watchJob(job, slices),
                { concurrency: this.concurrency }
            );
        }
    }

    async _resume(job: JobMetadata) {
        const { jobInfoString, status } = this.getJobIdentifiers(job);

        if (status === 'paused') {
            reply.yellow(`Resuming ${jobInfoString}`);

            try {
                await job.api.resume();
            } catch (e) {
                reply.fatal(e);
            }

            await this.verifyJobRunning(job);
            return;
        }

        if (status === ExecutionStatus.running) {
            reply.green(`${jobInfoString} is already running`);
            return;
        }

        reply.fatal(`Cannot resume ${jobInfoString} because it is not paused, status is ${status}`);
    }

    async _start(job: JobMetadata): Promise<void> {
        const { jobInfoString, status } = this.getJobIdentifiers(job);

        if (this.terminalStatuses.includes(status as ExecutionStatus)) {
            reply.yellow(`${display.setAction('start', 'present')} ${jobInfoString}`);

            try {
                await job.api.start();
            } catch (e) {
                reply.fatal(e.message);
            }

            await this.verifyJobRunning(job);
            return;
        }

        if (status === ExecutionStatus.running) {
            reply.green(`${jobInfoString} is already running`);
            return;
        }

        reply.fatal(`Could not start ${jobInfoString}, current job status is ${status}`);
    }

    batchJobsBeforeStart(): JobMetadata[][] {
        // This should be a config setting
        const maxWorkersInBatch = 50;

        const batches: JobMetadata[][] = [];

        if (this.jobs.length === 1) {
            batches.push(this.jobs);

            return batches;
        }

        let batchWorkerCount = 0;
        let batch = [];

        for (const job of this.jobs) {
            const { workers } = job.config;

            // to prevent big jobs from putting the batch way over the limit
            if (workers > maxWorkersInBatch && batch.length > 0) {
                batches.push(batch);
                batch = [];
                batchWorkerCount = 0;
            }

            batchWorkerCount += workers;
            batch.push(job);

            if (batchWorkerCount > maxWorkersInBatch) {
                batches.push(batch);
                batch = [];
                batchWorkerCount = 0;
            }
        }

        if (batch.length) {
            batches.push(batch);
        }

        return batches;
    }

    private async verifyJobRunning(job: JobMetadata) {
        const { jobInfoString, status } = this.getJobIdentifiers(job);

        let newStatus = status;

        const statusUpdate = await this.waitStatusChange(
            job,
            ExecutionStatus.running
        );

        newStatus = statusUpdate.newStatus! as ExecutionStatus;

        job.status = newStatus;

        if (statusUpdate.error === true) {
            throw new Error(statusUpdate.errorMessage?.message);
        }

        if (newStatus === ExecutionStatus.running) {
            reply.green(`${jobInfoString} is running`);
            return;
        }
    }

    private async watchJob(job: JobMetadata, slices: number) {
        const { jobInfoString } = this.getJobIdentifiers(job);

        reply.yellow(`Watching ${jobInfoString} for ${slices} slices`);

        const startCheck = new Date().getTime();
        let slicesCompleted = 0;
        let failedSlices = 0;
        let watchTime = 0;
        let currentWorkers = 0;

        const maxWatchTime = 300_000; // 5 minute max wait time to watch job

        // give job time to initialize before checking status
        await pDelay(3_000);

        while (slices > slicesCompleted && watchTime < maxWatchTime) {
            const [jobStats] = await job.api.controller();

            if (jobStats == null) {
                reply.fatal(`Could not get controller information for ${jobInfoString}`);
            }

            slicesCompleted = jobStats.processed;
            failedSlices = jobStats.failed;
            currentWorkers = jobStats.workers_active + jobStats.workers_available;

            if (slicesCompleted > slices) break;

            watchTime = startCheck - new Date().getTime();

            // wait 10 seconds and check again
            await pDelay(10_000);
        }

        reply.green(`Completed watch for ${jobInfoString}`);

        if (failedSlices > 0) {
            reply.fatal(`${jobInfoString} had ${failedSlices} failed slices and completed ${slicesCompleted} slices`);
        }

        const requestedWorkers = job.config.workers;

        // should this fail? or try to add workers?
        if (this.correctNumberWorkers(currentWorkers, requestedWorkers) === false) {
            reply.fatal(`${jobInfoString} only has ${currentWorkers} workers, expecting ${requestedWorkers}`);
            return;
        }

        if (watchTime > maxWatchTime) {
            reply.fatal(`Watch for ${jobInfoString} timed out after 5 minutes.  Completed ${slicesCompleted} slices, with ${failedSlices} failed slices and ${currentWorkers} workers`);
        }

        reply.green(`${jobInfoString} successfully completed ${slicesCompleted} slices with ${currentWorkers} workers`);
    }

    async pause(): Promise<void> {
        await pMap(
            this.jobs,
            (job) => this._pause(job),
            { concurrency: this.concurrency }
        );

        this.allPausedOrStoppedCheck(ExecutionStatus.paused);
    }

    async _pause(job: JobMetadata) {
        const { jobInfoString } = this.getJobIdentifiers(job);

        if (this.preStoppedOrPausedCheck(job, ExecutionStatus.paused)) return;

        reply.warning(`Attempting to pause ${jobInfoString}`);

        job.api.pause()
            .catch((e) => new Error(e));

        await this.postStoppedOrPausedCheck(job, ExecutionStatus.paused);
    }

    async stop(): Promise<void> {
        await pMap(
            this.jobs,
            (job) => this._stop(job),
            { concurrency: this.concurrency }
        );

        this.allPausedOrStoppedCheck(ExecutionStatus.stopped);
    }

    private async allPausedOrStoppedCheck(
        expectedStatus: ExecutionStatus.stopped | ExecutionStatus.paused
    ) {
        const actionVerb = expectedStatus === ExecutionStatus.paused ? 'pause' : 'stop';

        const notAtStatus = this.jobs
            .filter((job) => {
                if (expectedStatus === ExecutionStatus.paused) {
                    return job.status !== expectedStatus;
                }

                return !this.terminalStatuses.includes(job.status);
            });

        if (notAtStatus.length) {
            const msg = notAtStatus.map((job) => `${job.config.name}, id: ${job.id}`);

            reply.fatal(`Jobs: ${msg.join('and')} were not ${display.setAction(actionVerb, 'past')} on ${this.config.args.clusterAlias}`);
        }

        if (
            (this.config.args.jobId.includes('all') && this.config.args._action !== 'restart')
            || this.config.args.save
        ) {
            await this.save();
        }
    }

    async _stop(job: JobMetadata): Promise<void> {
        const { jobInfoString } = this.getJobIdentifiers(job);

        if (this.preStoppedOrPausedCheck(job, ExecutionStatus.stopped)) return;

        reply.yellow(`${display.setAction('stop', 'present')} ${jobInfoString}`);

        job.api.stop()
            .catch((e) => reply.fatal(e));

        await this.postStoppedOrPausedCheck(job, ExecutionStatus.stopped);
    }

    private preStoppedOrPausedCheck(
        job: JobMetadata,
        action: ExecutionStatus.stopped | ExecutionStatus.paused
    ): boolean {
        const {
            status,
            jobInfoString
        } = this.getJobIdentifiers(job);

        const actionVerb = action === ExecutionStatus.paused ? 'pause' : 'stop';

        if (job.status === action) {
            reply.warning(`${jobInfoString}, is already ${display.setAction(actionVerb, 'past')}`);
            return true;
        }

        if (this.terminalStatuses.includes(status as ExecutionStatus)) {
            reply.warning(`${jobInfoString} is not running. Current status is ${job.status}`);
            return true;
        }

        return false;
    }

    private async postStoppedOrPausedCheck(
        job: JobMetadata,
        action: ExecutionStatus.stopped | ExecutionStatus.paused
    ) {
        const actionVerb = action === ExecutionStatus.paused ? 'pause' : 'stop';

        const { jobInfoString } = this.getJobIdentifiers(job);

        const statusUpdate = await this.waitStatusChange(job, action);

        job.status = statusUpdate.newStatus!;

        if (statusUpdate.error === true) {
            throw new Error(statusUpdate.errorMessage?.message);
        }

        if (statusUpdate.newStatus === action) {
            reply.green(`${jobInfoString} is ${display.setAction(actionVerb, 'past')}`);
        } else {
            reply.fatal(`Could not ${actionVerb} ${jobInfoString}, current job status is ${statusUpdate.newStatus}`);
        }
    }

    private correctNumberWorkers(currentWorkers: number, requestedWorkers: number): boolean {
        // difference between current workers and requested
        // should be less than 10% of requested workers + 1
        return Math.abs(currentWorkers - requestedWorkers) < Math.round(requestedWorkers / 10) + 1;
    }

    private async waitStatusChange(
        job: JobMetadata,
        action: ExecutionStatus
    ): Promise<StatusUpdate> {
        const timeout = this.config.args.timeout ?? 300_000;
        const interval = this.config.args.interval ?? 10_000;

        const statusUpdate: StatusUpdate = { error: false };

        try {
            const newStatus = await job.api.waitForStatus(action, interval, timeout);

            statusUpdate.newStatus = newStatus;
        } catch (e: unknown) {
            reply.warning(e);

            statusUpdate.error = true;
            statusUpdate.errorMessage = e as Error;
        }

        return statusUpdate;
    }

    private async getJobMetadata() {
        const jobIds = await this.getJobIds();

        await pMap(
            jobIds as string[],
            (jobId) => this.addJobs(jobId),
            { concurrency: this.concurrency }
        );

        if (this.jobs.length === 0) this.noJobsWithStatus();
    }

    private async getJobIds(): Promise<string[]> {
        if (this.config.args.jobId.includes('all')) {
            return this.getAllJobs();
        }

        if (['run', 'start'].includes(this.config.args._action) && this.config.args.save) {
            return this.getJobIdsFromSavedState();
        }

        return this.config.args.jobId;
    }

    private async getAllJobs() {
        if (await this.prompt()) {
            // if action is start and not from a restart
            // then need to get job ids from saved state
            if (this.config.args._action === 'start') {
                if (fs.pathExistsSync(this.config.jobStateFile) === false) {
                    reply.fatal(`Could not find job state file for ${this.config.args.clusterAlias}, this is required to start all jobs`);
                }

                return this.getJobIdsFromSavedState();
            }

            return this.getActiveJobIds();
        }

        reply.warning('bye!');
        process.exit(0);
    }

    private async getJobIdsFromSavedState() {
        const state = await fs.readJson(this.config.jobStateFile);

        return Object.keys(state);
    }

    private async getActiveJobIds(): Promise<string[]> {
        const controllers = await this.getClusterControllers();

        return controllers.map((controller) => controller.job_id);
    }

    private async addJobs(jobId: string) {
        const jobApi = this.teraslice.client.jobs.wrap(jobId);

        const status = await this.getStatus(jobApi);

        if (this.statusCheck(this.config.args.status, status)) {
            const jobMetadata: Partial<JobMetadata> = {
                id: jobId,
                api: jobApi,
                status
            };

            const config = await jobApi.config();

            jobMetadata.config = config;

            this.jobs.push(jobMetadata as JobMetadata);
        }
    }

    async getStatus(jobApi: Job) {
        let status: ExecutionStatus | RegisteredStatus = RegisteredStatus.no_execution;

        try {
            status = await jobApi.status();
        } catch (e) {
            if (e.message.includes('No execution was found for job')) {
                // Indicates that job is registered but not ran yet
                status = RegisteredStatus.no_execution;
            } else {
                reply.fatal(e);
            }
        }

        return status;
    }

    statusCheck(
        statusList: (ExecutionStatus | RegisteredStatus)[] | undefined,
        status: ExecutionStatus | RegisteredStatus
    ): boolean {
        if (statusList && statusList.length) {
            return statusList.includes(status);
        }

        return true;
    }

    noJobsWithStatus() {
        const cluster = `cluster: ${this.config.args.clusterUrl}`;
        const targetedStatus = `${this.config.args.status.join(' or ')}`;

        if (this.config.args.jobId.includes('all')) {
            reply.fatal(`No jobs on ${cluster} with status ${targetedStatus}`);
        }

        reply.fatal(`Jobs: ${this.config.args.jobId.join(', ')} on ${cluster} do not have status ${targetedStatus}`);
    }

    private getJobIdentifiers(job: JobMetadata) {
        const { name } = job.config;
        const { id, status } = job;
        const url = this.config.clusterUrl;

        return {
            name,
            id,
            status,
            url,
            jobInfoString: `job: ${name}, id: ${id} on cluster: ${url}`
        };
    }

    private async prompt() {
        if (this.config.args.yes) return true;

        const prompt = await display.showPrompt(
            this.config.args._action,
            `all jobs on ${this.config.args.clusterAlias}`
        );

        return prompt;
    }

    async getClusterControllers() {
        try {
            return this.teraslice.client.cluster.controllers();
        } catch (e) {
            throw Error(e);
        }
    }
}
