import path from 'node:path';
import fs from 'fs-extra';
import {
    has,
    set,
    unset,
    get,
    cloneDeep,
    isKey
} from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';
import Config from './config.js';
import Jobs from './jobs.js';
import { getPackage } from './utils.js';
import { JobConfigFile } from '../interfaces.js';

import reply from './reply.js';

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

export function validateAndUpdateCliConfig(cliConfig: Config) {
    for (const jobFile of cliConfig.args.jobFile) {
        const jobConfig = getJobConfigFromFile(cliConfig.args.srcDir, jobFile) as JobConfigFile;

        validateJobFile(jobConfig);
        fileMetadataToCliArgs(cliConfig, jobConfig);
    }
}

function fileMetadataToCliArgs(cliConfig: Config, jobConfig: JobConfigFile) {
    if (cliConfig.args.jobId) {
        cliConfig.args.jobId.push(jobConfig.__metadata.cli.job_id);
    } else {
        cliConfig.args.jobId = [jobConfig.__metadata.cli.job_id];
    }

    if (cliConfig.args.clusterUrl == null) {
        cliConfig.args.clusterUrl = jobConfig.__metadata.cli.cluster;
    } else if (cliConfig.args.clusterUrl !== jobConfig.__metadata.cli.cluster) {
        reply.fatal('If working with multiple jobs they must be on the same cluster');
    }
}

export async function updateJobConfig(cliConfig: Config) {
    const job = new Jobs(cliConfig);
    job.verifyK8sImageContinuity(cliConfig);

    for (const jobFile of cliConfig.args.jobFile) {
        const jobConfig = getJobConfigFromFile(cliConfig.args.srcDir, jobFile) as JobConfigFile;

        const jobId = jobConfig.__metadata.cli.job_id;
        const tsCluster = jobConfig.__metadata.cli.cluster;

        // remove metadata from the jobConfig before posting to the cluster
        unset(jobConfig, '__metadata');

        try {
            const update = await job.teraslice.client.cluster.put(`/jobs/${jobId}`, jobConfig);

            if (get(update, 'job_id') !== jobId) {
                reply.fatal(`Could not be updated job ${jobId} on ${tsCluster}`);
            }

            addMetaData(jobConfig, jobId, tsCluster);
            saveConfig(cliConfig.args.srcDir, jobFile, jobConfig);

            reply.green(`Updated job ${jobId} config on ${tsCluster}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }

    return job;
}

export async function registerJobToCluster(cliConfig: Config) {
    const job = new Jobs(cliConfig);
    job.verifyK8sImageContinuity(cliConfig);

    for (const jobFile of cliConfig.args.jobFile) {
        const jobConfig = getJobConfigFromFile(cliConfig.args.srcDir, jobFile) as JobConfigFile;

        validateJobFile(jobConfig);

        if (hasMetadata(jobConfig)) {
            const regCluster = get(jobConfig, '__metadata.cli.cluster');

            reply.green(`job has already been registered on ${regCluster}`);
            continue;
        }

        try {
            const resp = await job.submitJobConfig(jobConfig);

            if (resp) {
                const jobId = resp.id();

                reply.green(`Successfully registered ${jobConfig.name} on ${cliConfig.clusterUrl} with job id ${jobId}`);

                addMetaData(jobConfig, jobId, cliConfig.clusterUrl);
                saveConfig(cliConfig.args.srcDir, jobFile, jobConfig);
                fileMetadataToCliArgs(cliConfig, jobConfig);

                continue;
            }

            reply.fatal(`Failed to register ${jobConfig.name} on ${cliConfig.clusterUrl}`);
        } catch (e) {
            reply.fatal(`Error ${e.message} registering job ${jobConfig.name} on ${cliConfig.clusterUrl}`);
        }
    }

    return job;
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

export function resetConfigFile(cliConfig: Record<string, any>) {
    for (const jobFile of cliConfig.args.jobFile) {
        const jobConfig = getJobConfigFromFile(
            cliConfig.args.srcDir,
            jobFile
        ) as JobConfigFile;

        validateJobFile(jobConfig);
        unset(jobConfig, '__metadata');
        saveConfig(cliConfig.args.srcDir, jobFile, jobConfig);
        reply.green(`Reset ${jobFile}, all __metadata removed`);
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

export async function saveJobConfigToFile(
    jobConfig: Teraslice.JobConfig,
    filePath: string,
    clusterUrl: string
) {
    const jobConfigCopy: Record<string, any> = {};
    const keysToSkip = ['job_id', '_created', '_context', '_updated', '_deleted', '_deleted_on'];

    for (const key of Object.keys(jobConfig)) {
        if (!keysToSkip.includes(key) && isKey(jobConfig, key)) {
            jobConfigCopy[key] = cloneDeep(jobConfig[key]);
        }
    }

    addMetaData(jobConfigCopy, jobConfig.job_id, clusterUrl);

    if (!fs.existsSync(filePath)) {
        await fs.writeJSON(filePath, jobConfigCopy);
    } else {
        throw new Error(`File already exists at ${filePath}`);
    }
}
