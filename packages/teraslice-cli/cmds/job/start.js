'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const reply = require('../cmd_functions/reply');
const dataChecks = require('../cmd_functions/data_checks');

exports.command = 'start <job_file>';
exports.desc = 'Starts job on the cluster in the job file\n';
exports.aliases = ['run'];
exports.builder = (yargs) => {
    yargs
        .option('c', {
            description: 'cluster for job to run on, works for new job or moving a job to a new cluster',
            type: 'string'
        })
        .option('m', {
            description: 'starts the job on a new cluster, this does not move the assets',
            type: 'boolean',
            default: false
        })
        .example('tjm start jobfile.prod.json');
};
exports.handler = (argv, _testFunctions) => {
    const tjmConfig = _.clone(argv);
    dataChecks(tjmConfig).returnJobData();

    const tjmFunctions = _testFunctions || require('../cmd_functions/functions')(tjmConfig);

    return Promise.resolve()
        .then(() => {
            // check if the job is new
            if (tjmConfig.c) {
                const jobContents = tjmConfig.job_file_content;
                // register the job on the cluster but don't run it
                return tjmFunctions.terasliceClient.jobs.submit(jobContents, true);
            }
            return Promise.resolve();
        })
        .then((registerResult) => {
            tjmConfig.job_id = registerResult
                ? registerResult.id() : tjmConfig.job_file_content.tjm.job_id;
            if (tjmConfig.c) {
                const jobContents = tjmConfig.job_file_content;
                const jobFilePath = tjmConfig.job_file_path;
                reply.green(`Successfully registered job: ${tjmConfig.job_id} on ${tjmConfig.cluster}`);
                _.set(jobContents, 'tjm.cluster', tjmConfig.cluster);
                _.set(jobContents, 'tjm.version', '0.0.1');
                _.set(jobContents, 'tjm.job_id', tjmConfig.job_id);
                tjmFunctions.createJsonFile(jobFilePath, jobContents);
                reply.green('Updated job file with tjm data');
            }
            return Promise.resolve();
        })
        .then(() => tjmFunctions.alreadyRegisteredCheck())
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(tjmConfig.job_id).start())
        .then((startResponse) => {
            if (_.has(startResponse, 'job_id')) {
                reply.green(`Started job ${tjmConfig.job_id}`);
            } else {
                reply.fatal('Could not start job');
            }
            return startResponse;
        })
        .catch(err => reply.fatal(err.message));
};
