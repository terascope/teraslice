import path from 'path';
import fs from 'fs-extra';
import {
    has,
    set,
    unset,
    get
} from '@terascope/utils';
import Config from './config';
import Jobs from './jobs';
import { getPackage } from '../../src/helpers/utils';
import { JobConfigFile } from '../interfaces';

import reply from '../helpers/reply';

/**
 * Functions to handle job config files
*/

export function validateJobFile(jobConfig: JobConfigFile): void {
    if (!(
        has(jobConfig, 'name')
        && has(jobConfig, 'workers')
        && has(jobConfig, 'lifecycle')
        && has(jobConfig, 'assets')
        && has(jobConfig, 'operations')
        && jobConfig.operations!.length >= 2
    )) {
        reply.fatal('Job config file is invalid');
    }
}

export function getJobConfigFromFile(
    filePath: string,
    fileName: string
): Record<string, any> | JobConfigFile {
    const fullPath = path.join(filePath, fileName);

    try {
        return fs.readJsonSync(fullPath);
    } catch (e) {
        if (e.message.includes('no such file or directory')) {
            reply.fatal(`Cannot find ${fullPath}, check your path and file name and try again`);
        }

        return reply.fatal(e.message);
    }
}

export function validateJobFileAndAddToCliConfig(cliConfig: Config) {
    let tsCluster: string | undefined;

    for (const jobFile of cliConfig.args.jobFile) {
        const jobConfig = getJobConfigFromFile(cliConfig.args.srcDir, jobFile) as JobConfigFile;

        validateJobFile(jobConfig);

        if (cliConfig.args.jobId) {
            cliConfig.args.jobId.push(jobConfig.__metadata.cli.job_id);
        } else {
            cliConfig.args.jobId = [jobConfig.__metadata.cli.job_id];
        }

        if (tsCluster == null) {
            tsCluster = jobConfig.__metadata.cli.cluster;
        } else if (tsCluster !== jobConfig.__metadata.cli.cluster) {
            reply.fatal('If starting multiple jobs they must be on the same cluster');
        }
    }

    cliConfig.args.clusterUrl = tsCluster;
}

export async function registerJobToCluster(cliConfig: Record<string, any>) {
    for (const jobFile of cliConfig.args.jobFile) {
        const jobConfig = getJobConfigFromFile(cliConfig.args.srcDir, jobFile) as JobConfigFile;

        validateJobFile(jobConfig);

        if (hasMetadata(jobConfig)) {
            const regCluster = get(jobConfig, '__metadata.cli.cluster');

            reply.green(`job has already been registered on ${regCluster}`);
            continue;
        }

        const job = new Jobs(cliConfig);

        const resp = await job.submitJobConfig(jobConfig);

        if (resp) {
            const jobId = resp.id();

            reply.green(`Successfully registered ${jobConfig.name} on ${cliConfig.clusterUrl} with job id ${jobId}`);

            addMetaData(jobConfig, jobId, cliConfig.clusterUrl);
            saveConfig(cliConfig.args.srcDir, jobFile, jobConfig);

            return job;
        }

        reply.fatal(`Failed to register ${jobConfig.name} on ${cliConfig.clusterUrl}`);
    }
}

export function convertOldTJMFiles(cliConfig: Record<string, any>) {
    for (const jobFile of cliConfig.args.jobFile) {
        const jobConfig = getJobConfigFromFile(
            cliConfig.args.srcDir,
            jobFile
        ) as Record<string, any>;

        if (has(jobConfig, '__metadata')) {
            reply.green(`${jobFile} is already compatible with teraslice-cli`);
            continue;
        }

        if (has(jobConfig, 'tjm')) {
            const jobId = jobConfig.tjm.job_id;
            const { cluster } = jobConfig.tjm;

            unset(jobConfig, 'tjm');

            addMetaData(cluster, jobId, cluster);
            saveConfig(cliConfig.args.srcDir, jobFile, jobConfig);

            reply.green(`${jobFile} converted to be compatible with teraslice-cli`);
        }
    }
}

export function addMetaData(
    config: Record<string, any>,
    id: string,
    clusterUrl: string
): void {
    const { version } = getPackage();

    set(config, '__metadata.cli.cluster', clusterUrl);
    set(config, '__metadata.cli.version', version);
    set(config, '__metadata.cli.job_id', id);
    set(config, '__metadata.cli.updated', new Date().toISOString());
}

export function saveConfig(
    filePath: string,
    fileName: string,
    config: Record<string, any>
): void {
    const fullPath = path.join(filePath, fileName);

    fs.writeJsonSync(fullPath, config, { spaces: 4 });
}

function hasMetadata(jobConfig: Record<string, any>): boolean {
    return has(jobConfig, '__metadata');
}
