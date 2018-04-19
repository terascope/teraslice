'use strict';

const _ = require('lodash');

exports.command = 'run [jobFile]';
exports.desc = 'Registers and runs a job. Use -c to specify the cluster\nUse -a to build and upload assets.\n Metadata will be written to the job file once the job is registered\n';
exports.builder = (yargs) => {
    yargs
        .option('c', { describe: 'cluster where the job will run, defaults to localhost',
            default: 'localhost' })
        .option('a', { describe: 'builds the assets and deploys to cluster, optional',
            default: false,
            type: 'boolean' })
        .example('tjm run -c ts_gen1.tera1.terascope.io -a teraslicejobFile');
};
exports.handler = (argv) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')(argv.jobFile);
    const jobData = jsonData.jobFileHandler();
    const tjmFunctions = require('./cmd_functions/functions')(argv);
    const jobContents = jobData[1];
    const jobFilePath = jobData[0];

    Promise.resolve()
        .then(() => tjmFunctions.loadAssets())
        .then(() => tjmFunctions.alreadyRegisteredCheck(jobContents))
        .then((result) => {
            if (result === true) {
                reply.warning(`Job ${jobContents.tjm.job_id} is already registered with cluster ${argv.c}`);
                reply.warning('Staring Job');
                return jobContents.tjm.job_id;
            }
            return false;
        })
        .then((result) => {
            if (result === false) {
                return tjmFunctions.teraslice.jobs.submit(jobContents)
                    .then(jobResult => jobResult.id());
            }
            return tjmFunctions.teraslice.jobs.wrap(result).start()
                .then(jobId => jobId.job_id);
        })
        .then((jobId) => {
            reply.success(`Started job: ${jobId} on ${argv.c}`);
            _.set(jobContents, 'tjm.cluster', tjmFunctions.httpClusterNameCheck(argv.c));
            _.set(jobContents, 'tjm.version', '0.0.1');
            _.set(jobContents, 'tjm.job_id', jobId);
            tjmFunctions.createJsonFile(jobFilePath, jobContents);
            reply.success('Updated job file with tjm data');
        })
        .catch(err => reply.error(err.message));
};
