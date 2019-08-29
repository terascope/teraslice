
import _ from 'lodash';
import fs from 'fs-extra';
import TerasliceUtil from './teraslice-util';
import Reply from '../cmds/lib/reply';
import displayModule from '../cmds/lib/display';

const display = displayModule();
const reply = new Reply();

export default class Jobs {
    /**
     *
     * @param {object} cliConfig config object
     *
     */
    config: any;
    teraslice: TerasliceUtil;
    jobsList: string[]; // list of jobs
    jobsListInitial: string[];
    allJobsStopped: boolean;
    activeStatus: string[];
    jobsListChecked: string[];

    constructor(cliConfig: any) {
        this.config = cliConfig;
        this.teraslice = new TerasliceUtil(this.config);
        this.jobsList = []; // list of jobs
        this.jobsListInitial = [];
        this.allJobsStopped = false;
        this.activeStatus = ['running', 'failing'];
        this.jobsListChecked = [];
    }

    get list() {
        return this.jobsList;
    }

    async workers() {
        const response = await this.teraslice.client.jobs.wrap(this.config.args.id)
            .changeWorkers(this.config.args.action, this.config.args.num);
        reply.info(`> job: ${this.config.args.id} ${response}`);
    }

    async pause() {
        await this.stop('pause');
    }

    async resume() {
        await this.start('resume');
    }

    async restart() {
        await this.stop();
        if (this.allJobsStopped) {
            await this.start();
        }
    }

    async recover() {
        const response = await this.teraslice.client.jobs.wrap(this.config.args.id).recover();
        if (_.has(response, 'job_id')) {
            reply.info(`> job_id ${this.config.args.id} recovered`);
        } else {
            // @ts-ignore
            reply.info(response);
        }
    }

    async run() {
        await this.start();
    }

    async save() {
        return this.status(true, true);
    }

    async status(saveState = false, showJobs = true) {
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

        const statusList = _.split(this.config.args.status, ',');
        for (const jobStatus of statusList) {
            const exResult = await this.teraslice.client.ex.list(jobStatus);
            const jobsTemp = await this.controllerStatus(exResult, jobStatus, controllers);
            _.each(jobsTemp, (job) => {
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

    async statusCheck(statusList: string[]) {
        let controllers = [];
        const jobs: string[] = [];
        try {
            controllers = await this.teraslice.client.cluster.controllers();
        } catch (e) {
            controllers = await this.teraslice.client.cluster.slicers();
        }

        for (const jobStatus of statusList) {
            const exResult = await this.teraslice.client.ex.list(jobStatus);
            const jobsTemp = await this.controllerStatus(exResult, jobStatus, controllers);
            _.each(jobsTemp, (job) => {
                jobs.push(job);
            });
        }
        return jobs;
    }

    async start(action = 'start') {
        // start job with job file
        if (!this.config.args.all) {
            const id = await this.teraslice.client.jobs.wrap(this.config.args.id).config();
            if (id !== undefined) {
                // @ts-ignore
                id.slicer = {};
                // @ts-ignore
                id.slicer.workers_active = id.workers;
                // @ts-ignore
                this.jobsList.push(id);
            }
        } else {
            this.jobsList = await fs.readJson(this.config.jobStateFile);
        }

        await this.checkJobsStart(this.activeStatus);
        if (this.jobsListChecked.length === 0) {
            reply.error(`No jobs to ${action}`);
            return;
        }

        if (this.jobsListChecked.length === 1) {
            this.config.yes = true;
        }
        if (this.config.yes || await display.showPrompt(action, `all jobs on ${this.config.args.clusterAlias}`)) {
            await this.changeStatus(this.jobsListChecked, action);
            let waitCount = 0;
            const waitMax = 10;
            let allWorkersStarted = false;
            this.jobsListInitial = this.jobsListChecked;
            reply.info('> Waiting for workers to start');
            while (!allWorkersStarted || waitCount < waitMax) {
                await this.status(false, false);
                waitCount += 1;
                allWorkersStarted = await this.checkWorkerCount(this.jobsListInitial,
                    this.jobsListChecked);
            }

            let allAddedWorkersStarted = false;
            if (allWorkersStarted) {
                // add extra workers
                waitCount = 0;
                await this.addWorkers(this.jobsListInitial, this.jobsListChecked);
                while (!allAddedWorkersStarted || waitCount < waitMax) {
                    await this.status(false, false);
                    waitCount += 1;
                    allAddedWorkersStarted = await this.checkWorkerCount(this.jobsListInitial,
                        this.jobsListChecked, true);
                }
            }

            if (allAddedWorkersStarted) {
                await this.status(false, true);

                await reply.info(`> All jobs and workers ${_.toString(await display.setAction(action, 'past'))}`);
            }
        } else {
            reply.info('bye!');
        }
    }

    async stop(action = 'stop') {
        let waitCountStop = 0;
        const waitMaxStop = 10;
        let stopTimedOut = false;

        if (this.config.args.all) {
            await this.save();
        } else {
            const id = await this.teraslice.client.jobs.wrap(this.config.args.id).config();
            if (id !== undefined) {
                // @ts-ignore
                id.slicer = {};
                // @ts-ignore
                id.slicer.workers_active = id.workers;
                // @ts-ignore
                this.jobsList.push(id);
            }
        }

        await this.checkJobsStop(this.activeStatus);
        if (this.jobsListChecked.length === 0) {
            if (this.config.args.all) {
                reply.error(`No jobs to ${action}`);
            } else {
                reply.error(`job: ${this.config.args.id} is not running, unable to stop`);
            }
            return;
        }

        if (this.jobsListChecked.length === 1) {
            this.config.args.yes = true;
        }

        if (this.config.args.yes || await display.showPrompt(action, `all jobs on ${this.config.args.clusterAlias}`)) {
            while (!stopTimedOut) {
                if (waitCountStop >= waitMaxStop) {
                    break;
                }
                try {
                    await this.changeStatus(this.jobsListChecked, action);
                    stopTimedOut = true;
                } catch (err) {
                    stopTimedOut = false;
                    reply.error(`> ${action} job(s) had an error [${err.message}]`);
                    await this.status(false, false);
                }
                waitCountStop += 1;
            }

            let waitCount = 0;
            const waitMax = 15;
            while (!this.allJobsStopped) {
                await this.status(false, false);
                await _.delay(() => {}, 50);
                if (this.jobsList.length === 0) {
                    this.allJobsStopped = true;
                }
                if (waitCount >= waitMax) {
                    break;
                }
                waitCount += 1;
            }
            if (this.allJobsStopped) {
                reply.info(`> All jobs ${_.toString(await display.setAction(action, 'past'))}.`);
            }
        }
    }
    // TODO: fixme
    async addWorkers(expectedJobs: any[], actualJobs: any[]) {
        for (const job of actualJobs) {
            for (const expectedJob of expectedJobs) {
                let addWorkersOnce = true;

                if (expectedJob.job_id === job.job_id) {
                    if (addWorkersOnce) {
                        let workers2add = 0;
                        if (_.has(expectedJob, 'slicer.workers_active')) {
                            workers2add = expectedJob.slicer.workers_active - expectedJob.workers;
                        }
                        if (workers2add > 0) {
                            reply.info(`> Adding ${workers2add} worker(s) to ${job.job_id}`);
                            await this.teraslice.client.jobs.wrap(job.job_id).changeWorkers('add', workers2add);
                            await _.delay(() => {}, 50);
                        }
                        addWorkersOnce = false;
                    }
                }
            }
        }
    }

    async checkWorkerCount(expectedJobs: any[], actualJobs: any[], addedWorkers = false) {
        let allWorkersStartedCount = 0;
        let allWorkers = false;
        let expectedWorkers = 0;
        let activeWorkers = 0;
        for (const job of actualJobs) {
            for (const expectedJob of expectedJobs) {
                if (expectedJob.job_id === job.job_id) {
                    if (addedWorkers) {
                        if (_.has(expectedJob, 'slicer.workers_active')) {
                            expectedWorkers = job.slicer.workers_active;
                        } else {
                            reply.fatal('no expected workers');
                        }
                    } else {
                        expectedWorkers = expectedJob.workers;
                    }
                    if (_.has(job, 'slicer.workers_active')) {
                        activeWorkers = job.slicer.workers_active;
                    }
                    if (expectedWorkers === activeWorkers) {
                        allWorkersStartedCount += 1;
                    }
                }
            }
        }
        if (allWorkersStartedCount === expectedJobs.length) {
            allWorkers = true;
        }
        return allWorkers;
    }

    async controllerStatus(result: any[], jobStatus: string, controllerList: any) {
        const jobs = [];
        for (const item of result) {
            // TODO, use args instead of hardcoding
            if (jobStatus === 'running' || jobStatus === 'failing') {
                _.set(item, 'slicer', _.find(controllerList, { job_id: `${item.job_id}` }));
            } else {
                item.slicer = 0;
            }
            jobs.push(item);
        }
        return jobs;
    }

    async checkJobsStop(statusList: any[]) {
        const activeJobs = await this.statusCheck(statusList);
        for (const job of this.jobsList) {
            for (const cjob of activeJobs) {
                // @ts-ignore
                if (job.job_id === cjob.job_id) {
                    // @ts-ignore
                    reply.info(`job: ${job.job_id} ${statusList}`);
                    this.jobsListChecked.push(job);
                }
            }
        }
    }

    async checkJobsStart(statusList: any[]) {
        const activeJobs = await this.statusCheck(statusList);
        for (const job of this.jobsList) {
            let found = false;
            for (const cjob of activeJobs) {
                // @ts-ignore
                if (job.job_id === cjob.job_id) {
                    // @ts-ignore
                    reply.info(`job: ${job.job_id} ${statusList}`);
                    found = true;
                }
            }
            if (!found) {
                this.jobsListChecked.push(job);
            }
        }
    }

    async changeStatus(jobs: any[], action: string) {
        reply.info(`> Waiting for jobs to ${action}`);
        // @ts-ignore
        const response = jobs.map((job) => {
            if (action === 'stop') {
                return this.teraslice.client.jobs.wrap(job.job_id).stop()
                    .then((stopResponse: any) => {
                        if (stopResponse.status.status === 'stopped' || stopResponse.status === 'stopped') {
                            return display.setAction(action, 'past')
                                .then((setActionResult) => {
                                    reply.info(`> job: ${job.job_id} ${setActionResult}`);
                                });
                        }
                        return display.setAction(action, 'present')
                            .then((setActionResult) => {
                                reply.info(`> job: ${job.job_id} error ${setActionResult}`);
                            });
                    });
            }
            if (action === 'start') {
                return this.teraslice.client.jobs.wrap(job.job_id).start()
                    .then((startResponse: any) => {
                        if (startResponse.job_id === job.job_id) {
                            return display.setAction(action, 'past')
                                .then((setActionResult) => {
                                    reply.info(`> job: ${job.job_id} ${setActionResult}`);
                                });
                        }
                        return display.setAction(action, 'present')
                            .then((setActionResult) => {
                                reply.info(`> job: ${job.job_id} error ${setActionResult}`);
                            });
                    });
            }
            if (action === 'resume') {
                return this.teraslice.client.jobs.wrap(job.job_id).resume()
                    .then((resumeResponse: any) => {
                        if (resumeResponse.status.status === 'running' || resumeResponse.status === 'running') {
                            return display.setAction(action, 'past')
                                .then((setActionResult) => {
                                    reply.info(`> job: ${job.job_id} ${setActionResult}`);
                                });
                        }
                        return display.setAction(action, 'present')
                            .then((setActionResult) => {
                                reply.info(`> job: ${job.job_id} error ${setActionResult}`);
                            });
                    });
            }
            if (action === 'pause') {
                return this.teraslice.client.jobs.wrap(job.job_id).pause()
                    .then((pauseResponse: any) => {
                        if (pauseResponse.status.status === 'paused' || pauseResponse.status === 'paused') {
                            return display.setAction(action, 'past')
                                .then((setActionResult) => {
                                    reply.info(`> job: ${job.job_id} ${setActionResult}`);
                                });
                        }
                        return display.setAction(action, 'present')
                            .then((setActionResult) => {
                                reply.info(`> job: ${job.job_id} error ${setActionResult}`);
                            });
                    });
            }

            return null;
        });
        // @ts-ignore
        return Promise.all(response);
    }
}
