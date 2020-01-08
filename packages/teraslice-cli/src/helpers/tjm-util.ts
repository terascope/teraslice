import Reply from '../cmds/lib/reply';

const reply = new Reply();

export default class TjmUtil {
    client: any;
    job: any;

    constructor(client: any, job: any) {
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
            if (e.message.includes('is currently running')) {
                reply.green(`> job: ${this.job.name}, id: ${this.job.jobId} is running on ${this.job.clusterUrl}`);
                return;
            }

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
