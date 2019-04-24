'use strict';

const reply = require('../cmds/lib/reply')();

class TjmUtil {
    constructor(client, job) {
        this.client = client;
        this.job = job;
    }

    async start() {
        try {
            const startResult = await this.client.jobs.wrap(this.job.jobId).start();

            if (!startResult.job_id || startResult.job_id !== this.job.jobId) {
                reply.fatal(`Could not start ${this.job.name} on ${this.job.clusterUrl}`);
            }

            reply.green(`Started ${this.job.name} on ${this.job.clusterUrl}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }

    async stop() {
        const terminalStatuses = [
            'stopped',
            'completed',
            'terminated',
            'failed',
            'rejected',
            'aborted'
        ];

        try {
            const status = await this.client.jobs.wrap(this.job.jobId).status();

            if (status === 'stopping') {
                reply.green(`job: ${this.job.name} is stopping, wait for job to stop`);
                await this.client.jobs.wrap(this.job.jobId).waitForStatus('stopped');
                reply.green(`Stopped job ${this.job.name} on ${this.job.clusterUrl}`);
                return;
            }

            if (terminalStatuses.includes(status)) {
                reply.green(`job: ${this.job.name}, job id: ${this.job.jobId}, is not running.  Current status is ${status} on cluster: ${this.job.clusterUrl}`);
            } else {
                reply.green(`attempting to stop job: ${this.job.name}, job id: ${this.job.jobId}, on cluster ${this.job.clusterUrl}`);
                const response = await this.client.jobs.wrap(this.job.jobId).stop();
                const jobStatus = response.status.status || response.status;

                if (jobStatus !== 'stopped') {
                    reply.fatal(`Could not stop ${this.job.name} on ${this.job.clusterUrl}`);
                }

                reply.green(`Stopped job ${this.job.name} on ${this.job.clusterUrl}`);
            }
        } catch (e) {
            reply.fatal(e);
        }
    }
}

module.exports = TjmUtil;
