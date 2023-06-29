import fs from 'fs-extra';
import {
    has, toString, pDelay, set, pMap
} from '@terascope/utils';
import {
    Job,
    ExecutionStatus,
    JobConfiguration,
    SlicerAnalytics
} from 'teraslice-client-js';
import TerasliceUtil from './teraslice-util';
import Display from '../helpers/display';
import reply from '../helpers/reply';

const display = new Display();

interface JobMetadata {
    id: string;
    api: Job;
    config: JobConfiguration;
    status: ExecutionStatus;
}

interface StatusUpdate {
    newStatus?: ExecutionStatus,
    error: boolean,
    errorMessage?: Error
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
    terminalStatuses: ExecutionStatus[];

    constructor(cliConfig: Record<string, any>) {
        this.config = cliConfig;
        this.teraslice = new TerasliceUtil(this.config);
        this.jobs = [];
        this.jobsListInitial = [];
        this.allJobsStopped = false;
        this.activeStatus = ['running', 'failing'];
        this.jobsListChecked = [];
        this.terminalStatuses = [
            ExecutionStatus.stopped,
            ExecutionStatus.completed,
            ExecutionStatus.terminated,
            ExecutionStatus.failed,
            ExecutionStatus.rejected,
        ];
    }

    get list(): JobMetadata[] {
        return this.jobs;
    }

    async initialize() {
        await this.getJobMetadata();
    }

    async workers(): Promise<string> {
        const response = await this.teraslice.client.jobs.wrap(this.config.args.id)
            .changeWorkers(this.config.args.action, this.config.args.number);

        return typeof response === 'string' ? response : response.message;
    }

    async pause(): Promise<void> {
        // await this.stop('pause');
         // if (action === 'pause') {
        //     return this.teraslice.client.jobs.wrap(job.job_id).pause()
        //         .then((pauseResponse) => {
        //             if ((pauseResponse.status as any)?.status === 'paused' || pauseResponse.status === 'paused') {
        //                 const setActionResult = display.setAction(action, 'past');
        //                 reply.info(`> job: ${job.job_id} ${setActionResult}`);
        //                 return;
        //             }
        //             const setActionResult = display.setAction(action, 'present');
        //             reply.info(`> job: ${job.job_id} error ${setActionResult}`);
        //         });
        // }
    }

    async resume(): Promise<void> {
        // await this.start('resume');
        // if (action === 'resume') {
        //     return this.teraslice.client.jobs.wrap(job.job_id).resume()
        //         .then((resumeResponse) => {
        //             if ((resumeResponse.status as any)?.status === 'running' || resumeResponse.status === 'running') {
        //                 const setActionResult = display.setAction(action, 'past');
        //                 reply.info(`> job: ${job.job_id} ${setActionResult}`);
        //                 return;
        //             }
        //             const setActionResult = display.setAction(action, 'present');
        //             reply.info(`> job: ${job.job_id} error ${setActionResult}`);
        //         });
        // }
    }

    // needs to restart multiple jobs, all jobs, or a single job
    // get all the job ids it should stop in an array
    // for each job id stop and wait until status is stopped
    // control concurrency
    // on restart
    // go through each job
    // ensure workers are running
    // no failed slices
    // has successfully completed N slices
    // then say job has been restarted
    async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }

    async recover(): Promise<void> {
        const response = await this.teraslice.client.jobs.wrap(this.config.args.id).recover();
        if (has(response, 'job_id')) {
            reply.info(`> job_id ${this.config.args.id} recovered`);
        } else {
            reply.info(toString(response));
        }
    }

    async run(): Promise<void> {
        // await this.start();
    }

    async save(): Promise<void> {
        // return this.status(true, true);
    }

    awaitStatus(): Promise<string> {
        return this.teraslice.client.jobs.wrap(this.config.args.id)
            .waitForStatus(this.config.args.status, 5000, this.config.args.timeout);
    }

    async status(saveState = false, showJobs = true): Promise<void> {
        let controllers = [];

        const header = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];
        const active = false;
        const parse = false;

        this.jobsList = [];

        const format = `${this.config.args.output}Horizontal`;

        try {
            controllers = await this.teraslice.client.cluster.controllers();
        } catch (e) {
            controllers = await this.teraslice.client.cluster.slicers();
        }

        const statusList = this.config.args.status.split(',');

        for (const jobStatus of statusList) {
            const exResult = await this.teraslice.client.executions.list(jobStatus);
            const jobsTemp = await this.controllerStatus(exResult, jobStatus, controllers);
            jobsTemp.forEach((job) => {
                this.jobsList.push(job);
            });
        }

        if (this.jobsList.length > 0) {
            if (showJobs) {
                const rows = await display.parseResponse(header, this.jobsList, active);
                await display.display(header, rows, format, active, parse);
            }
            if (saveState) {
                reply.green(`\n> saved state to ${this.config.jobStateFile}`);
                await fs.writeJson(this.config.jobStateFile, this.jobsList, { spaces: 4 });
            }
        }
    }

    async start(): Promise<void> {
        // start job with job file
        // add save file
        // file is needed because the jobs won't be on the cluster
        // if (!this.config.args.all) {
        //     const id: any = await this.teraslice.client.jobs.wrap(this.config.args.id).config();

        //     if (id != null) {
        //         id.slicer = {};
        //         id.slicer.workers_active = id.workers;
        //         this.jobsList.push(id);
        //     }
        // } else {
        //     this.jobsList = await fs.readJson(this.config.jobStateFile);
        // }

        await pMap(
            this.jobs,
            (job) => this._startJob(job),
            { concurrency: 1 }
        );

        if ('watch' in this.config.args) {
            const slices = this.config.args.watch ?? 50;

            for (const job of this.jobs) {
                await this.watchJob(job, slices);
            }
        }
    }

    async _startJob(job: JobMetadata): Promise<void> {
        const { name } = job.config;
        const { id, status } = job;
        const alias = this.config.args.clusterAlias;

        let newStatus = status;

        if (this.terminalStatuses.includes(status)) {
            reply.warning(`attempting to start ${name}: ${id} on ${alias}`);

            try {
                await job.api.start();
            } catch (e) {
                reply.fatal(e.message);
            }

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
                reply.green(`job: ${name}, id: ${id} is running on ${alias}`);
                return;
            }
        }

        if (status === ExecutionStatus.running) {
            reply.green(`job: ${name}, id: ${id} is already running on ${alias}`);
            return;
        }

        reply.fatal(`Could not start job ${name}, id: ${id} on ${alias}, current job status is ${newStatus}`);
    }

    private async watchJob(job: JobMetadata, slices: number) {
        const { name } = job.config;
        const { id } = job;
        const alias = this.config.args.clusterAlias;

        const jobInfo = `${name}, id: ${id}, on cluster ${alias}`;

        reply.green(`Watching ${jobInfo} for ${slices} slices`);

        const startCheck = new Date().getTime();
        let slicesCompleted = 0;
        let failedSlices = 0;
        let watchTime = 0;
        let currentWorkers = 0;

        const maxWatchTime = 300_000; // 5 minute max wait time to watch job

        // allow job to initialize before checking
        await pDelay(3_000);

        while (slices > slicesCompleted && watchTime < maxWatchTime) {
            const [jobStats] = await job.api.controller();
            console.log(jobStats);

            if (jobStats == null) {
                reply.fatal(`Could not get controller information for job ${name}, id: ${id} on cluster ${alias}`);
            }

            slicesCompleted = jobStats.processed;
            failedSlices = jobStats.failed;
            currentWorkers = jobStats.workers_active + jobStats.workers_available;

            watchTime = startCheck - new Date().getTime();

            // wait 10 seconds and try again
            await pDelay(10_000);
        }

        reply.green(`Completed watch for ${jobInfo}`);

        if (failedSlices > 0) {
            reply.fatal(`${jobInfo} had ${failedSlices} failed slices and completed ${slicesCompleted} slices`);
        }

        const requestedWorkers = job.config.workers;

        // should this fail? or try to add workers?
        if (this.correctNumberWorkers(currentWorkers, requestedWorkers) === false) {
            reply.fatal(`${jobInfo} only has ${currentWorkers} workers, expecting ${requestedWorkers}`);
            return;
        }

        if (watchTime > maxWatchTime) {
            reply.fatal(`Watch for ${jobInfo} timed out after 5 minutes.  Completed ${slicesCompleted} slices, with ${failedSlices} failed slices and ${currentWorkers} workers`);
        }

        reply.green(`Job: ${name} successfully completed ${slicesCompleted} slices with ${currentWorkers} workers`);
    }

    async stop(): Promise<void> {
        await pMap(
            this.jobs,
            (job) => this._stopJob(job),
            { concurrency: 4 }
        );

        const notStopped = this.jobs
            .filter((jobs) => jobs.status !== ExecutionStatus.stopped);

        if (notStopped.length) {
            const msg = notStopped.map((job) => {
                const jobData = `${job.config.name}, id: ${job.id}`;

                return jobData;
            });

            reply.fatal(`Jobs: ${msg.join('and')} were not stopped`);
        }

        reply.green('All jobs stopped');
    }

    async _stopJob(job: JobMetadata): Promise<void> {
        const { name } = job.config;
        const { id, status } = job;
        const alias = this.config.args.clusterAlias;

        if (job.status === 'stopped') {
            reply.warning(`job: ${name}, job id: ${id}, is already stopped on cluster: ${alias}`);
            return;
        }

        if (this.terminalStatuses.includes(status)) {
            reply.warning(`job: ${name}, job id: ${id}, is not running. Current status is ${job.status} on cluster: ${alias}`);
            return;
        }

        reply.warning(`attempting to stop job: ${name}, job id: ${id}, on cluster ${alias}`);

        job.api.stop()
            .catch((e) => new Error(e));

        const statusUpdate = await this.waitStatusChange(job, ExecutionStatus.stopped);

        job.status = statusUpdate.newStatus!;

        if (statusUpdate.error === true) {
            throw new Error(statusUpdate.errorMessage?.message);
        }

        if (statusUpdate.newStatus === ExecutionStatus.stopped) {
            reply.green(`job: ${name}, id: ${id} is stopped on ${alias}`);
        } else {
            reply.fatal(`Could not stop job ${name}, id: ${id} on ${alias}, current job status is ${statusUpdate.newStatus}`);
        }
    }

    // TODO: fixme
    async addWorkers(expectedJobs: any[], actualJobs: any[]): Promise<void> {
        for (const job of actualJobs) {
            for (const expectedJob of expectedJobs) {
                let addWorkersOnce = true;

                if (expectedJob.job_id === job.job_id) {
                    if (addWorkersOnce) {
                        let workers2add = 0;
                        if (has(expectedJob, 'slicer.workers_active')) {
                            workers2add = expectedJob.slicer.workers_active - expectedJob.workers;
                        }
                        if (workers2add > 0) {
                            reply.info(`> Adding ${workers2add} worker(s) to ${job.job_id}`);
                            await this.teraslice.client.jobs.wrap(job.job_id).changeWorkers('add', workers2add);
                            await pDelay(50);
                        }
                        addWorkersOnce = false;
                    }
                }
            }
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
        console.log('args', this.config.args);
        const jobIds = await this.getJobIds();

        await pMap(
            jobIds as string[],
            (jobId) => this.addJobs(jobId),
            { concurrency: 5 }
        );

        if (this.jobs.length === 0) this.noJobsWithStatus();
    }

    private async getJobIds(): Promise<string[]> {
        if (this.config.args.jobId.includes('all')) {
            if (this.config.args.yes || await display.showPrompt(
                this.config.args._action,
                `all jobs on ${this.config.args.clusterAlias}`
            )) return this.getActiveJobIds();

            reply.warning('bye!');
            process.exit(0);
        }

        return this.config.args.jobId;
    }

    private async getActiveJobIds(): Promise<string[]> {
        const controllers = await this.getClusterControllers();

        return controllers.map((controller) => controller.job_id);
    }

    private async addJobs(jobId: string) {
        const jobApi = await this.teraslice.client.jobs.wrap(jobId);

        const status = await jobApi.status();

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

    statusCheck(statusList: ExecutionStatus[], status: ExecutionStatus): boolean {
        if (statusList.length) {
            return statusList.includes(status);
        }

        return true;
    }

    noJobsWithStatus() {
        const cluster = `cluster: ${this.config.args.clusterAlias}`;
        const targetedStatus = `${this.config.args.status.join(' or ')}`;

        if (this.config.args.jobId.includes('all')) {
            reply.fatal(`No jobs on ${cluster} with status ${targetedStatus}`);
        }

        reply.fatal(`Jobs: ${this.config.args.jobId.join(', ')} on ${cluster} do not have status ${targetedStatus}`);
    }

    async getClusterControllers() {
        try {
            return this.teraslice.client.cluster.controllers();
        } catch (e) {
            throw Error(e);
        }
    }
}
