'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

exports.command = 'register [jobFile]';
exports.desc = 'Registers job with a cluster.  Specify the cluster with -c.\nAdds metadata to job file on completion\n';
exports.builder = (yargs) => {
    yargs
        .option('c', { describe: 'cluster where the job will be registered',
            default: 'localhost' })
        .option('a', { describe: 'builds the assets and deploys to cluster, optional',
            default: false,
            type: 'boolean' })
        .example('tjm register jobfile.prod -c ts_gen1.tera1.terascope.io -a');
};
exports.handler = (argv) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')(argv.jobFile);
    const tjmFunctions = require('./cmd_functions/functions')(argv);
    const jobData = jsonData.jobFileHandler();
    const jobContents = jobData[1];
    const jobFilePath = jobData[0];

    Promise.resolve()
        .then(() => tjmFunctions.alreadyRegisteredCheck(jobContents))
        .then((result) => {
            if (result === true) {
                return Promise.reject(Error(`Job ${jobContents.tjm.job_id} is already registered with cluster ${argv.c}`));
            }
            return Promise.resolve(true);
        })
        .then(() => tjmFunctions.loadAssets())
        .then(() => tjmFunctions.teraslice.jobs.submit(jobContents, true))
        .then((result) => {
            const jobId = result.id();
            reply.success(`Successfully registered job: ${jobId} on ${argv.c}`);
            _.set(jobContents, 'tjm.cluster', tjmFunctions.httpClusterNameCheck(argv.c));
            _.set(jobContents, 'tjm.version', '0.0.1');
            _.set(jobContents, 'tjm.job_id', jobId);
            tjmFunctions.createJsonFile(jobFilePath, jobContents);
            reply.success('Updated job file with tjm data');
        })
        .catch(err => reply.error(err.message));
};
