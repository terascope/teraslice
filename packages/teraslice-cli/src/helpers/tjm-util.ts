import path from 'path';
import fs from 'fs-extra';
import { has, set } from '@terascope/utils';
import { TerasliceClient } from 'teraslice-client-js';
import Config from './config';
import { JobConfigFile } from '../interfaces';

import reply from '../helpers/reply';

/**
 * Functions to handle job config files
*/

export function validateJobFile(filePath: string, fileName: string): JobConfigFile {
    let jobConfig: any;

    const fullPath = path.join(filePath, fileName);

    try {
        jobConfig = fs.readJsonSync(fullPath);
    } catch (e) {
        if (e.message.includes('no such file or directory')) {
            reply.fatal(`Cannot find ${fullPath}, check your path and file name and try again`);
        }

        reply.fatal(e.message);
    }

    if (!(
        has(jobConfig, 'name')
        && has(jobConfig, 'workers')
        && has(jobConfig, 'lifecycle')
        && has(jobConfig, 'assets')
        && has(jobConfig, 'operations')
        && jobConfig.operations.length >= 2
    )) {
        reply.fatal('Job config file is invalid');
    }

    return jobConfig as JobConfigFile;
}

export function validateJobFileAndAddToCliConfig(cliConfig: Config) {
    let tsCluster: string | undefined;

    for (const jobFile of cliConfig.args.jobFile) {
        const jobConfigFile = validateJobFile(cliConfig.args.srcDir, jobFile);

        if (cliConfig.args.jobId) {
            cliConfig.args.jobId.push(jobConfigFile.__metadata.cli.job_id);
        } else {
            cliConfig.args.jobId = [jobConfigFile.__metadata.cli.job_id];
        }

        if (tsCluster == null) {
            tsCluster = jobConfigFile.__metadata.cli.cluster;
        } else if (tsCluster !== jobConfigFile.__metadata.cli.cluster) {
            reply.fatal('If starting multiple jobs they must be on the same cluster');
        }
    }

    cliConfig.args.clusterUrl = tsCluster;
}

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
