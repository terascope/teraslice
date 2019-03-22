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
            if (!startResult.job_id === this.job.jobId) {
                reply.fatal(`Could not start ${this.job.name} on ${this.job.clusterUrl}`);
            }
            reply.green(`Started ${this.job.name} on ${this.job.clusterUrl}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }

    async stop() {
        try {
            const response = await this.client.jobs.wrap(this.job.jobId).stop();
            if (response.status.status !== 'stopped') {
                reply.fatal(`Could not stop ${this.job.name} on ${this.job.clusterUrl}`);
            }
            reply.green(`Stopped job ${this.job.name} on ${this.job.clusterUrl}`);
        } catch (e) {
            if (e.message.includes('no execution context was found')) {
                reply.fatal(`Job ${this.job.name} is not currently running on ${this.job.clusterUrl}`);
            }
            if (e.message.includes('Cannot update terminal job status of "stopped" to "stopping"')) {
                reply.green(`Job ${this.job.name} on ${this.job.clusterUrl} is already stopped`);
                return;
            }
            reply.fatal(e);
        }
    }
}

module.exports = TjmUtil;
