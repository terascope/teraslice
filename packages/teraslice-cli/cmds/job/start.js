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
    const cliConfig = _.clone(argv);
    dataChecks(cliConfig).returnJobData();

    const tjmFunctions = _testFunctions || require('../cmd_functions/functions')(cliConfig);

    return Promise.resolve()
        .then(() => {
            // check if the job is new
            if (cliConfig.c) {
                const jobContents = cliConfig.job_file_content;
                // register the job on the cluster but don't run it
                return tjmFunctions.terasliceClient.jobs.submit(jobContents, true);
            }
            return Promise.resolve();
        })
        .then((registerResult) => {
            cliConfig.job_id = registerResult
                ? registerResult.id() : cliConfig.job_file_content.tjm.job_id;
            if (cliConfig.c) {
                const jobContents = cliConfig.job_file_content;
                const jobFilePath = cliConfig.job_file_path;
                reply.green(`Successfully registered job: ${cliConfig.job_id} on ${cliConfig.cluster}`);
                _.set(jobContents, 'tjm.cluster', cliConfig.cluster);
                _.set(jobContents, 'tjm.version', '0.0.1');
                _.set(jobContents, 'tjm.job_id', cliConfig.job_id);
                tjmFunctions.createJsonFile(jobFilePath, jobContents);
                reply.green('Updated job file with tjm data');
            }
            return Promise.resolve();
        })
        .then(() => tjmFunctions.alreadyRegisteredCheck())
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(cliConfig.job_id).start())
        .then((startResponse) => {
            if (_.has(startResponse, 'job_id')) {
                reply.green(`Started job ${cliConfig.job_id}`);
            } else {
                reply.fatal('Could not start job');
            }
            return startResponse;
        })
        .catch(err => reply.fatal(err.message));
};
