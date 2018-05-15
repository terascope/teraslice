'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

exports.command = 'run [jobFile]';
exports.desc = 'Registers and runs a job. Use -c to specify the cluster\nUse -a to build and upload assets.\n Metadata will be written to the job file once the job is registered\n';
exports.builder = (yargs) => {
    yargs
        .option('c', { describe: 'cluster where the job will run, defaults to localhost',
            default: 'localhost:5678' })
        .option('a', { describe: 'builds the assets and deploys to cluster, optional',
            default: false,
            type: 'boolean' })
        .example('tjm run -c ts_gen1.tera1.terascope.io -a teraslicejobFile');
};
exports.handler = (argv) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobData = jsonData.jobFileHandler(argv.jobFile);
    const tjmFunctions = require('./cmd_functions/functions')(argv);
    const jobContents = jobData[1];
    const jobFilePath = jobData[0];

    Promise.resolve()
        .then(() => Promise.all([tjmFunctions.alreadyRegisteredCheck(jobContents), tjmFunctions.loadAsset()]))
        .spread((isAlreadyRegistered) => {
            if (isAlreadyRegistered) {
                reply.warning(`Job ${jobContents.tjm.job_id} is already registered with cluster ${argv.c}`);
            }
            return tjmFunctions.teraslice.jobs.submit(jobContents)
        })
        .then((jobResult) => {
            const jobId = jobResult.id();
            reply.success(`Started job: ${jobId} on ${argv.c}`);
            _.set(jobContents, 'tjm.cluster', tjmFunctions.httpClusterNameCheck(argv.c));
            _.set(jobContents, 'tjm.version', '0.0.1');
            _.set(jobContents, 'tjm.job_id', jobId);
            return tjmFunctions.createJsonFile(jobFilePath, jobContents);
        })
        .then(() => reply.success('Updated job file with tjm data'))
        .catch(err => reply.error(err.message));
};
