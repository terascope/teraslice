import { TerasliceClient } from 'teraslice-client-js';
import reply from '../helpers/reply';

export default class TjmUtil {
    client: TerasliceClient;
    job: Record<string, any>;

    constructor(client: TerasliceClient, job: Record<string, any>) {
        this.client = client;
        this.job = job;
    }

    async start(): Promise<void> {
        try {
            const startResult = await this.client.jobs.wrap(this.job.id).start();

            if (!startResult.job_id || startResult.job_id !== this.job.id) {
                reply.fatal(`Could not start ${this.job.name} on ${this.job.clusterUrl}`);
            }

            reply.green(`Started ${this.job.name} on ${this.job.clusterUrl}`);
        } catch (e) {
            if (e.message.includes('is currently running')) {
                reply.green(`> job: ${this.job.name}, id: ${this.job.id} is running on ${this.job.clusterUrl}`);
                return;
            }

            reply.fatal(e.message);
        }
    }

    async pause(): Promise<void> {
        try {
            const response = await this.client.jobs.wrap(this.job.id).pause();
            reply.green(`> job: ${this.job.name}, id: ${this.job.id} has been ${response.status}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }

    async resume(): Promise<void> {
        try {
            const response = await this.client.jobs.wrap(this.job.id).resume();
            reply.green(`> job: ${this.job.name}, id: ${this.job.id} has been ${response.status}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }

    async stop(): Promise<void> {
        const terminalStatuses = [
            'stopped',
            'completed',
            'terminated',
            'failed',
            'rejected',
            'aborted'
        ];

        try {
            const status = await this.client.jobs.wrap(this.job.id).status();

            if (status === 'stopped') {
                reply.info(`> job: ${this.job.name}, job id: ${this.job.id}, is already stopped running on cluster: ${this.job.clusterUrl}`);
                return;
            }

            if (terminalStatuses.includes(status)) {
                reply.info(`> job: ${this.job.name}, job id: ${this.job.id}, is not running. Current status is ${status} on cluster: ${this.job.clusterUrl}`);
                return;
            }

            reply.green(`attempting to stop job: ${this.job.name}, job id: ${this.job.id}, on cluster ${this.job.clusterUrl}`);
            const response = await this.client.jobs.wrap(this.job.id).stop();
            const jobStatus = response.status;

            if (jobStatus === 'stopped') {
                reply.green(`Stopped job ${this.job.name} on ${this.job.clusterUrl}`);
            } else {
                reply.fatal(`Could not stop job ${this.job.name} on ${this.job.clusterUrl}, current job status is ${jobStatus}`);
            }
        } catch (e) {
            reply.fatal(e);
        }
    }
}
