import fs from 'fs-extra';
import {
    has, toString, pDelay, pMap,
    pRetry, isKey
} from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';
import chalk from 'chalk';
import * as diff from 'diff';
import path from 'node:path';
import { Job } from 'teraslice-client-js';
import TerasliceUtil from './teraslice-util.js';
import Display from './display.js';
import reply from './reply.js';
import { getJobConfigFromFile, saveJobConfigToFile } from './tjm-util.js';
import Config from './config.js';
import {
    JobMetadata,
    JobConfigFile,
    StatusUpdate,
    RegisteredStatusEnum,
    AllStatusTypes,
    Messages,
    UpdateActions
} from '../interfaces.js';

const statusEnum = Teraslice.ExecutionStatusEnum;

const display = new Display();

/// Extracts version of teraslice out of kubernetes image name
function getK8sJobVersion(imageTag: string | any): string {
    // Define the version number regex pattern
    const versionRegex = /v(\d+\.\d+\.\d+)/;

    // Use match to find the first match in the input string
    // It's important that the teraslice version is first in
    // the image tag or it will give an incorrect version number
    const match = imageTag.match(versionRegex);

    // If a match is found, return the entire matched version
    // otherwise, return error string
    return match ? match[0] : 'Version number not available';
}

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
    terminalStatuses: (AllStatusTypes)[];
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
            Teraslice.ExecutionStatusEnum.stopped,
            Teraslice.ExecutionStatusEnum.completed,
            Teraslice.ExecutionStatusEnum.terminated,
            Teraslice.ExecutionStatusEnum.failed,
            Teraslice.ExecutionStatusEnum.rejected,
            RegisteredStatusEnum.no_execution
        ];
    }

    get list(): JobMetadata[] {
        return this.jobs;
    }

    async submitJobConfig(jobConfig: Teraslice.JobConfigParams) {
        try {
            return this.teraslice.client.jobs.submit(jobConfig, true);
        } catch (e) {
            reply.fatal(e);
        }
    }

    async verifyK8sImageContinuity(cliConfig: Config) {
        /// Grab all job files and verify each
        const clusterStats = await this.teraslice.client.cluster.info();
        for (const jobFile of cliConfig.args.jobFile) {
            const jobConfig = getJobConfigFromFile(cliConfig.args.srcDir, jobFile) as JobConfigFile;
            if (
                clusterStats.clustering_type === 'kubernetesV2'
                && jobConfig.kubernetes_image !== undefined
                && !jobConfig.kubernetes_image?.includes(clusterStats.teraslice_version)
                && !jobConfig.kubernetes_image?.includes('dev-')
            ) {
                const k8sJobVersion = getK8sJobVersion(jobConfig.kubernetes_image);
                reply.warning('--------');
                reply.warning('Teraslice Cluster is using a different version of teraslice than this job');
                reply.warning(`Cluster: ${this.teraslice.config.clusterUrl}, TS version: ${clusterStats.teraslice_version}`);
                reply.warning(`Job: ${jobConfig.name}, TS Version: ${k8sJobVersion}`);
                reply.warning('--------');
            }
        }
    }

    async initialize() {
        await this.getJobMetadata();
    }

    async checkStatus() {
        for (const job of this.jobs) {
            this.logUpdate({ action: 'status', job });
        }
    }

    async view(): Promise<void> {
        for (const job of this.jobs) {
            this.logUpdate({ action: 'view', job });
        }
    }

    async adjustWorkers(): Promise<void> {
        for (const job of this.jobs) {
            const { status } = this.getJobIdentifiers(job);

            if (this.terminalStatuses.includes(status)) {
                this.logUpdate({ action: 'adjust_workers_terminal', job });
                return;
            }

            try {
                const response = await job.api.changeWorkers(
                    this.config.args.action,
                    this.config.args.number
                );

                this.logUpdate({ job, msg: typeof response === 'string' ? response : response.message });
            } catch (e) {
                this.commandFailed(e.message, job);
            }
        }
    }

    async recover(): Promise<void> {
        for (const job of this.jobs) {
            const { status } = this.getJobIdentifiers(job);

            if (status !== Teraslice.ExecutionStatusEnum.failed) {
                this.logUpdate({ action: 'recover_not_failed', job });
                continue;
            }

            try {
                const response = await job.api.recover();

                this.logUpdate({
                    job,
                    msg: has(response, 'job_id') ? toString(response) : 'Successfully recovered'
                });
            } catch (e) {
                this.commandFailed(e.message, job);
            }
        }
    }

    async checkForErrors() {
        const opts = {
            from: this.config.args.from,
            sort: this.config.args.sort,
            size: this.config.args.size
        };
        const active = false;
        const parse = false;
        const header = ['ex_id', 'slice_id', 'slicer_id', 'slicer_order', 'state', '_created', '_updated', 'error'];
        const format = `${this.config.args.output}Horizontal`;

        for (const job of this.jobs) {
            try {
                const response = await job.api.errors(opts);

                const rows = display.parseResponse(header, response ?? [], active);

                if (rows.length > 0) {
                    await display.display(header, rows, format, active, parse);
                } else {
                    this.logUpdate({ action: 'check_for_errors', job });
                }
            } catch (e) {
                this.commandFailed(e.message, job);
            }
        }
    }

    async awaitStatus(): Promise<void> {
        const wantedStatus = this.config.args.status;

        await Promise.all(this.jobs.map((job) => this.await(job, wantedStatus)));
    }

    private async await(job: JobMetadata, wantedStatus: Teraslice.ExecutionStatus[]) {
        const statusUpdate = await this.waitStatusChange(job, wantedStatus);

        const newStatus = statusUpdate.newStatus!;

        if (statusUpdate.error === true) {
            this.commandFailed(statusUpdate.errorMessage as string, job);
        }

        if (wantedStatus.includes(newStatus)) {
            this.logUpdate({ msg: `Reached status: ${newStatus}`, job });
        } else {
            this.commandFailed(`could not reach status ${wantedStatus.join(' or ')}`, job);
        }
    }

    async save(): Promise<void> {
        const state: Record<string, any> = {};

        const jobIds = this.jobs.map((job) => job.id);

        reply.yellow(`Saving controller and execution state for ${jobIds.join(', ')} on ${this.config.args.clusterAlias}`);

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

    private async getJobState(
        job: JobMetadata
    ): Promise<[Teraslice.ExecutionConfig, Teraslice.ExecutionList]> {
        try {
            return Promise.all([job.api.execution(), job.api.controller()]);
        } catch (e) {
            return this.commandFailed(e.message, job);
        }
    }

    async resume(): Promise<void> {
        await this.startOrResume('resume');
    }

    async run(): Promise<void> {
        await this.startOrResume('start');
    }

    async start(): Promise<void> {
        await this.startOrResume('start');
    }

    async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }

    async startOrResume(action: 'start' | 'resume') {
        const batches = this.batchJobsBeforeStart();

        for (const batch of batches) {
            await pMap(
                batch,
                (job) => this.startOrResumeOne(job, action),
                { concurrency: batch.length }
            );
        }

        if (this.config.args.watch > 0) {
            await pMap(
                this.jobs,
                (job) => this.watchJob(job),
                { concurrency: this.concurrency }
            );
        }
    }

    async startOrResumeOne(job: JobMetadata, action: 'start' | 'resume'): Promise<void> {
        const { status } = this.getJobIdentifiers(job);

        if ((action === 'resume' && status === 'paused')
            || (action === 'start' && this.inTerminalStatus(job))) {
            this.logUpdate({ action: display.setAction(action, 'present'), job });

            try {
                await job.api[action]();
            } catch (e) {
                this.commandFailed(e.message, job);
            }

            await this.verifyJobRunningOrCompleted(job);
            return;
        }

        if (status === statusEnum.running) {
            this.logUpdate({ action: 'running', job });
            return;
        }

        this.commandFailed(`Could not ${action} job, status is ${status}`, job);
    }

    batchJobsBeforeStart(): JobMetadata[][] {
        const maxWorkersInBatch = this.config.args.max_workers ?? 50;

        const batches: JobMetadata[][] = [];

        if (this.jobs.length === 1) {
            batches.push(this.jobs);

            return batches;
        }

        let batchWorkerCount = 0;
        let batch: JobMetadata[] = [];

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

    private async verifyJobRunningOrCompleted(job: JobMetadata) {
        const statusUpdate = await this.waitStatusChange(
            job,
            [statusEnum.running, statusEnum.completed]
        );

        const newStatus = statusUpdate.newStatus! as Teraslice.ExecutionStatus;

        // update job status in case of further job processes
        job.status = newStatus;

        if (statusUpdate.error === true) {
            this.commandFailed(statusUpdate.errorMessage as string, job);
        }

        if (newStatus === statusEnum.running) {
            this.logUpdate({ action: 'running', job });
            return;
        }

        if (newStatus === statusEnum.completed) {
            this.logUpdate({ action: 'quick_completed', job });
            return;
        }
    }

    private async watchJob(job: JobMetadata) {
        const { timeout, interval, watch: slices } = this.config.args;

        this.logUpdate({ action: 'start_watching', job });

        const startCheck = new Date().getTime();
        let slicesCompleted = 0;
        let failedSlices = 0;
        let watchTime = 0;
        let currentWorkers = 0;

        // give job time to initialize before checking status
        await pDelay(interval);

        while (slices > slicesCompleted && watchTime < timeout) {
            const [jobStats] = await job.api.controller();

            if (jobStats == null) {
                this.commandFailed('Could not get controller information', job);
            }

            slicesCompleted = jobStats.processed;
            failedSlices = jobStats.failed;
            currentWorkers = jobStats.workers_active + jobStats.workers_available;

            if (slicesCompleted > slices) break;

            watchTime = startCheck - new Date().getTime();

            // wait and check again
            await pDelay(interval);
        }

        if (failedSlices > 0) {
            this.commandFailed(`Job had ${failedSlices} failed slices and completed ${slicesCompleted} slices`, job);
        }

        const requestedWorkers = job.config.workers;

        // should this fail? or try to add workers?
        if (this.correctNumberWorkers(currentWorkers, requestedWorkers) === false) {
            this.commandFailed(`Job only has ${currentWorkers} workers, expecting ${requestedWorkers}`, job);
        }

        if (watchTime > timeout) {
            this.commandFailed(`Job watch timed out. Completed ${slicesCompleted} slices, with ${failedSlices} failed slices and ${currentWorkers} workers`, job);
        }

        this.logUpdate({
            msg: `Successfully completed ${slicesCompleted} slices with ${currentWorkers} workers`,
            job
        });
    }

    async pause(): Promise<void> {
        await pMap(
            this.jobs,
            (job) => this.pauseOrStopOne(job, 'pause'),
            { concurrency: this.concurrency }
        );
    }

    async stop(): Promise<void> {
        if (
            (this.config.args.jobId.includes('all') && this.config.args._action !== 'restart')
            || this.config.args.save
        ) {
            await this.save();
        }

        await pMap(
            this.jobs,
            (job) => this.pauseOrStopOne(job, 'stop'),
            { concurrency: this.concurrency }
        );
    }

    async pauseOrStopOne(
        job: JobMetadata,
        action: 'stop' | 'pause'
    ): Promise<void> {
        const executionStatus = action === 'pause' ? statusEnum.paused : statusEnum.stopped;

        if (job.status === executionStatus) {
            this.logUpdate({ action: display.setAction(action, 'past'), job });
            return;
        }

        if (this.inTerminalStatus(job)) {
            this.logUpdate({ action: `cannot_${action}`, job });
            return;
        }

        this.logUpdate({ action: display.setAction(action, 'present'), job });

        job.api[action]()
            .catch((e) => reply.fatal(e.message));

        const statusUpdate = await this.waitStatusChange(job, executionStatus);

        job.status = statusUpdate.newStatus!;

        if (statusUpdate.error === true) {
            this.commandFailed(statusUpdate.errorMessage as string, job);
        }

        if (statusUpdate.newStatus === executionStatus) {
            this.logUpdate({ action: display.setAction(action, 'past'), job });
        } else {
            this.commandFailed(`Could not ${action} job, job status is ${job.status}`, job);
        }
    }

    async delete(): Promise<void> {
        if (!this.config.args.jobId.includes('all') && this.config.args.yes !== true) {
            const jobsString = this.jobs.length === 1
                ? `job ${this.jobs[0].id}`
                : `jobs ${this.jobs.map((job) => job.id).join(', ')}`;
            const prompt = await display.showPrompt(
                this.config.args._action,
                `${jobsString} on ${this.config.clusterUrl}`
            );
            if (!prompt) return;
        }

        await pMap(
            this.jobs,
            (job) => this.deleteOne(job),
            { concurrency: this.concurrency }
        );
    }

    async deleteOne(job: JobMetadata) {
        if (!this.inTerminalStatus(job)) {
            const { jobInfoString } = this.getJobIdentifiers(job);

            reply.error(`Job is in non-terminal status ${job.status}, cannot delete. Skipping\n${jobInfoString}`);
            return;
        }

        try {
            await job.api.deleteJob();
        } catch (e) {
            this.commandFailed(e.message, job);
        }

        this.logUpdate({ action: 'deleted', job });
    }

    private inTerminalStatus(job: JobMetadata): boolean {
        return this.terminalStatuses.includes(job.status);
    }

    private correctNumberWorkers(currentWorkers: number, requestedWorkers: number): boolean {
        // difference between current workers and requested
        // should be less than 10% of requested workers + 1
        return Math.abs(currentWorkers - requestedWorkers) < Math.round(requestedWorkers / 10) + 1;
    }

    private async waitStatusChange(
        job: JobMetadata,
        action: Teraslice.ExecutionStatus | Teraslice.ExecutionStatus[]
    ): Promise<StatusUpdate> {
        const { timeout, interval } = this.config.args;

        const statusUpdate: StatusUpdate = { error: false };

        try {
            const newStatus = await job.api.waitForStatus(action, interval, timeout);

            statusUpdate.newStatus = newStatus;
        } catch (e: unknown) {
            reply.warning((e as Error).message);

            statusUpdate.error = true;
            statusUpdate.errorMessage = (e as Error).message;
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
            const { _action: action, clusterAlias } = this.config.args;
            // if action is start and not from a restart
            // then need to get job ids from saved state
            if (action === 'start') {
                if (fs.pathExistsSync(this.config.jobStateFile) === false) {
                    reply.fatal(`Could not find job state file for ${clusterAlias}, this is required to ${action} all jobs`);
                }

                return this.getJobIdsFromSavedState();
            }

            // if action is delete or export  we need to
            // get inactive as well as active jobs
            if (action === 'delete' || action === 'export') {
                return this.getActiveAndInactiveJobIds();
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

    private async getActiveAndInactiveJobIds() {
        try {
            const jobs = await this.teraslice.client.jobs.list();
            return jobs.map((job) => job.job_id);
        } catch (e) {
            throw Error(e);
        }
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

    async getStatus(jobApi: Job): Promise<AllStatusTypes> {
        let status: AllStatusTypes;

        try {
            status = await jobApi.status();
        } catch (e) {
            if (e.message.includes('No execution was found for job')) {
                // Indicates that job is registered but not ran yet
                status = RegisteredStatusEnum.no_execution;
            } else {
                reply.fatal(e);
            }
        }
        // @ts-expect-error
        return status;
    }

    statusCheck(
        statusList: (AllStatusTypes)[] | undefined,
        status: AllStatusTypes
    ): boolean {
        if (statusList && statusList.length) {
            return statusList.includes(status);
        }

        return true;
    }

    noJobsWithStatus() {
        const cluster = `cluster: ${this.config.clusterUrl}`;
        const targetedStatus = `${this.config.args.status.join(' or ')}`;

        if (this.config.args.jobId.includes('all')) {
            reply.fatal(`No jobs on ${cluster} with status ${targetedStatus || '"any"'}`);
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
            jobInfoString: `--------\njob: ${name}\nid: ${id}\ncluster: ${url}\n--------\n`
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

    formatJobConfig(jobConfig: JobConfigFile) {
        const finalJobConfig: Record<string, any> = {};
        Object.keys(jobConfig).forEach((key) => {
            if (isKey(jobConfig, key)) {
                if (key === '__metadata') {
                    finalJobConfig.job_id = jobConfig[key].cli.job_id;
                    finalJobConfig._updated = jobConfig[key].cli.updated;
                } else {
                    finalJobConfig[key] = jobConfig[key];
                }
            }
        });
        return finalJobConfig as Partial<Teraslice.JobConfig>;
    }

    getLocalJSONConfigs(srcDir: string, files: string[]) {
        const localJobConfigs: Record<string, Partial<Teraslice.JobConfig>> = {};
        for (const file of files) {
            const filePath = path.join(srcDir, file);
            const jobConfig: JobConfigFile = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }));
            const formattedJobConfig = this.formatJobConfig(jobConfig);
            if (formattedJobConfig.job_id) {
                localJobConfigs[formattedJobConfig.job_id] = formattedJobConfig;
            }
        }
        return localJobConfigs;
    }

    printDiff(diffResult: diff.Change[], showUpdateField: boolean) {
        diffResult.forEach((part) => {
            let color: typeof chalk;
            let symbol: string;
            let pointer: string;
            if (part.added) {
                color = chalk.green;
                symbol = '+';
                pointer = '   <--- local job file value';
            } else if (part.removed) {
                color = chalk.red;
                symbol = '-';
                pointer = '   <--- state cluster value';
            } else {
                color = chalk.grey;
                symbol = ' ';
                pointer = '';
            }
            const lines = part.value.split('\n');
            lines.forEach((line) => {
                /// Don't print blank lines
                if (line.length !== 0) {
                    /// These fields aren't in the job file so don't compare in diff
                    if (!line.includes('"_created":') && !line.includes('"_context":')) {
                        /// Check to see if we want to display _updated field
                        if (line.includes('"_updated":')) {
                            if (showUpdateField) {
                                process.stdout.write(color(`${symbol} ${line}${pointer}\n`));
                            }
                        } else {
                            process.stdout.write(color(`${symbol} ${line}${pointer}\n`));
                        }
                    }
                }
            });
        });
    }

    getJobDiff(job: JobMetadata) {
        const localJobConfigs = this.getLocalJSONConfigs(
            this.config.args.srcDir,
            this.config.args.jobFile
        );
        const diffObject = diff.diffJson(job.config, localJobConfigs[job.id]);

        /// "_update" fields on the job file are always off by a couple milliseconds
        /// We only want to display a diff of this field if it's greater than a minute
        let showUpdateField = false;
        const jobConfigUpdateTime = new Date(job.config._updated).getTime();
        const updated = localJobConfigs[job.id]._updated;
        if (updated === undefined) {
            throw new Error(`Could not retrieve last update time of job ${job.id}`);
        }
        const localConfigUpdateTime = new Date(updated).getTime();
        const timeDiff = Math.abs(localConfigUpdateTime - jobConfigUpdateTime);
        if (timeDiff > (1000 * 60)) {
            showUpdateField = true;
        }

        this.printDiff(diffObject, showUpdateField);
    }

    async export() {
        const jobIds = this.jobs.map((job) => job.id);

        reply.yellow(`Saving jobFile(s) for ${jobIds.join(', ')} on ${this.config.args.clusterAlias}`);

        for (const job of this.jobs) {
            await this.exportOne(job.config);
        }

        reply.green(`Saved jobFile(s) to ${this.config.outdir}`);
    }

    async exportOne(jobConfig: Teraslice.JobConfig) {
        await pRetry(() => {
            const filePath = this.createUniqueFilePath(jobConfig.name);
            return saveJobConfigToFile(jobConfig, filePath, this.config.clusterUrl);
        });
    }

    /**
     * @param { string } jobConfigName
     * @returns {string} A unique file path
     *
     * Using the name from a jobConfig and the outdir,
     * creates a unique file path where a job can be exported.
     * Spaces in the job name are replaced with underscores.
     * If the file name exists a '-N' suffix will be added to the name.
     *     ex: First export: '~/my_current_directory/my_job_name.json'
     *        Second export: '~/my_current_directory/my_job_name-1.json'
     */
    private createUniqueFilePath(jobConfigName: string) {
        const dirName = this.config.outdir;
        const fileName = `${jobConfigName.replaceAll(' ', '_')}.json`;
        const filePath = path.join(dirName, fileName);
        let uniquePath = filePath;
        let i = 1;

        while (fs.existsSync(uniquePath)) {
            uniquePath = `${filePath.slice(0, -5)}-${i}.json`;
            i++;
        }

        return uniquePath;
    }

    /**
     * @param args action and final property, final indicates if it is part of a series of commands
     * @param job job metadata
     *
     * Logs status updates relative to the actions being performed on the job
     */

    private logUpdate(args: { action?: UpdateActions; msg?: string; job: JobMetadata }) {
        const {
            action,
            msg,
            job
        } = args;

        let message = msg;
        let final = true;

        const { jobInfoString } = this.getJobIdentifiers(job);

        if (msg == null && action) {
            ({ message, final } = this.getUpdateMessage(action, job));
        }

        if (this.config.args.diff && action === 'view') {
            this.getJobDiff(job);
        } else {
            reply.yellow(`> ${message}`);
        }

        if (final) {
            reply.green(`${jobInfoString}`);
        }
    }

    private getUpdateMessage(
        action: keyof Messages,
        job: JobMetadata
    ): { message: string; final: boolean } {
        const {
            name,
            id,
            status
        } = this.getJobIdentifiers(job);

        const messages = {
            running: {
                message: `${name} is running`,
                final: true
            },
            stopping: {
                message: `${display.setAction('stop', 'present')} ${name}, ${id}`,
                final: false
            },
            status: {
                message: `status: ${status}`,
                final: true
            },
            adjust_workers_terminal: {
                message: `Cannot adjust workers. Job in terminal status ${status}`,
                final: true
            },
            recover_not_failed: {
                message: `Status is not failed, but ${status}. No need to recover`,
                final: true
            },
            check_for_errors: {
                message: 'No Errors',
                final: true
            },
            quick_completed: {
                message: 'Job has already completed',
                final: true
            },
            resuming: {
                message: `${display.setAction('resume', 'present')}, ${name}, ${id}`,
                final: false
            },
            starting: {
                message: `${display.setAction('start', 'present')} ${name}, ${id}`,
                final: false
            },
            start_watching: {
                message: `Watching for ${name}, ${id}, for ${this.config.args.watch} slices`,
                final: false
            },
            pausing: {
                message: `Attempting to pause ${name}, ${id}`,
                final: false
            },
            paused: {
                message: `${name} is paused`,
                final: true
            },
            stopped: {
                message: `${name} is stopped`,
                final: this.finalAction(action)
            },
            view: {
                message: `config:\n${JSON.stringify(job.config, null, 4)}`,
                final: this.finalAction(action)
            },
            cannot_pause: {
                message: `Job is in terminal status ${status}, cannot pause`,
                final: true,
            },
            cannot_stop: {
                message: `No need to stop, job is already in terminal status ${status}`,
                final: this.finalAction(action)
            },
            deleted: {
                message: `${name} has been deleted`,
                final: true
            },
            started: {
                message: `${display.setAction('start', 'past')}, ${name}, ${id}`,
                final: false
            },
            restarted: {
                message: `${display.setAction('restart', 'past')}, ${name}, ${id}`,
                final: false
            },
            restarting: {
                message: `${display.setAction('restart', 'present')}, ${name}, ${id}`,
                final: false
            },
            resumed: {
                message: `${display.setAction('resume', 'past')}, ${name}, ${id}`,
                final: false
            }
        };

        return messages[action];
    }

    private finalAction(action: string) {
        if (action === 'view' && this.config.args._action === 'update' && this.config.args.start === true) {
            return false;
        }

        if ((action === 'stopped' || action === 'stopTerminal')
            && (this.config.args._action === 'restart'
                || this.config.args._action === 'update')) return false;

        return true;
    }

    /**
     *
     * @param msg message or error to print to the console
     * @param job job metadata
     *
     * After printing the message the process exits with code 1
     */
    private commandFailed(msg: string, job: JobMetadata) {
        const { jobInfoString } = this.getJobIdentifiers(job);

        return reply.fatal(`${msg}\n${jobInfoString}`);
    }
}
