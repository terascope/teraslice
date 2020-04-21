import { TerasliceClient, ExecutionStatus } from 'teraslice-client-js';
import Reply from '../cmds/lib/reply';

const reply = new Reply();

export default class TjmUtil {
    client: TerasliceClient;
    job: any;

    constructor(client: any, job: any) {
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

    async pause() {
        try {
            const response = await this.client.jobs.wrap(this.job.id).pause();
            reply.green(`> job: ${this.job.name}, id: ${this.job.id} has been ${response.status}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }

    async resume() {
        try {
            const response = await this.client.jobs.wrap(this.job.id).resume();
            reply.green(`> job: ${this.job.name}, id: ${this.job.id} has been ${response.status}`);
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
            const status = await this.client.jobs.wrap(this.job.id).status();

            if (status === 'stopping') {
                reply.green(`job: ${this.job.name} is stopping, wait for job to stop`);
                await this.client.jobs.wrap(this.job.id).waitForStatus(ExecutionStatus.stopped);
                reply.green(`Stopped job ${this.job.name} on ${this.job.clusterUrl}`);
                return;
            }

            if (terminalStatuses.includes(status)) {
                reply.green(`job: ${this.job.name}, job id: ${this.job.id}, is not running.  Current status is ${status} on cluster: ${this.job.clusterUrl}`);
            } else {
                reply.green(`attempting to stop job: ${this.job.name}, job id: ${this.job.id}, on cluster ${this.job.clusterUrl}`);
                const response = await this.client.jobs.wrap(this.job.id).stop();
                const jobStatus = response.status;

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
