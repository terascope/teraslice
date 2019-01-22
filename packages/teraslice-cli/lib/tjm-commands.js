
'use strict';

const _ = require('lodash');
const JobSrc = require('./job-src');
const Config = require('./config');
const reply = require('../cmds/lib/reply')();
const { getTerasliceClient } = require('./utils');

class TjmCmds {
    constructor(argv) {
        this.job = new JobSrc(argv);
        this.job.readFile();
        this.job.validateJob();
        if (!this.job.hasMetaData) {
            reply.fatal('Job file does not contain cli data, register the job first');
        }
        this.cluster = this.job.content.__metadata.cli.cluster;
        argv.clusterUrl = this.cluster;
        this.jobId = this.job.content.__metadata.cli.job_id;
        this.name = this.job.content.name;
        this.cliConfig = new Config(argv);
        this.terasliceClient = getTerasliceClient(this.cliConfig);
    }

    async errors() {
        const response = await this.terasliceClientJobsFunction('errors');
        if (response.length === 0) {
            reply.green(`No errors for ${this.name} on ${this.cluster}`);
        } else {
            reply.yellow(`Errors for ${this.name} on ${this.cluster}:\n`);
            response.forEach(error => reply.yellow(JSON.stringify(error, null, 4)));
        }
    }

    async start() {
        const clientResponse = await this.terasliceClientJobsFunction('start');

        if (!clientResponse.job_id === this.jobId) {
            reply.fatal(`Could not start ${this.name} on ${this.cluster}`);
        }
        reply.green(`Started ${this.name} on ${this.cluster}`);
    }

    async status() {
        const clientResponse = await this.terasliceClientJobsFunction('status');

        if (!clientResponse) {
            reply.fatal(`Could not get status for job ${this.jobId} on ${this.cluster}`);
        }
        reply.green(`${this.name} is ${clientResponse} on ${this.cluster}`);
    }

    async stop() {
        const clientResponse = await this.terasliceClientJobsFunction('stop');

        if (!clientResponse.status.status === 'stopped') {
            reply.fatal(`Could not be stop ${this.name} on ${this.cluster}`);
        }
        reply.green(`Stopped job ${this.name} on ${this.cluster}`);
    }

    async terasliceClientJobsFunction(functionName, ...args) {
        let clientResponse;
        try {
            clientResponse = await this.terasliceClient.jobs.wrap(this.jobId)[functionName](...args);
        } catch (e) {
            if (e.message.includes('no execution context was found')) {
                reply.fatal(`Job ${this.name} is not currently running on ${this.cluster}`);
            }
            reply.fatal(e);
        }
        return clientResponse;
    }

    async view() {
        const jobSpec = await this.terasliceClient.jobs.wrap(this.jobId).config();
        reply.yellow(`${this.name} on ${this.cluster}:`);
        reply.green(JSON.stringify(jobSpec, null, 4));
    }

    async update() {
        let response;
        // strip metadata before updating job
        _.unset(this.job.content, '__metadata');
        try {
            response = await this.terasliceClient.cluster.put(`/jobs/${this.jobId}`, this.job.content);
        } catch (e) {
            reply.fatal(e);
        }
        if (!_.get(response, 'job_id') === this.job_id) {
            reply.fatal(`Could not be updated job ${this.jobId} on ${this.cluster}`);
        }
        this.job.addMetaData(this.jobId, this.cluster);
        this.job.overwrite();
        reply.green(`Updated job ${this.jobId} config on ${this.cluster}`);
        await this.view();
    }

    async workers() {
        // TODO validate number
        const currentStatus = await this.terasliceClientJobsFunction('status');
        if (currentStatus !== 'running') {
            reply.fatal(`${this.name} is currently ${currentStatus} and workers cannot be added`);
        }
        const response = await this.terasliceClientJobsFunction(
            'changeWorkers', this.cliConfig.args.workerAction, this.cliConfig.args.number
        );
        console.log(response);
    }
}

module.exports = TjmCmds;
