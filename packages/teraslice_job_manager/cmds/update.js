'use strict';

const _ = require('lodash');
const reply = require('./cmd_functions/reply')();
const dataChecks = require('./cmd_functions/data_checks');

exports.command = 'update [job_file]';
exports.desc = 'Updates the job on the cluster listed in the job file\nUse -r to run or restart the job after the update\n';
exports.builder = (yargs) => {
    yargs
        .option('r', {
            describe: 'option to restart the job after updating\n',
            default: false,
            type: 'boolean'
        })
        .example('tjm update jobfile.prod.json -r');
};
exports.handler = (argv, _testFunctions) => {
    const tjmConfig = _.clone(argv);
    dataChecks(tjmConfig).returnJobData();
    
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(tjmConfig);
    const jobId = tjmConfig.job_file_content.tjm.job_id;
    const cluster = tjmConfig.cluster;

    function restartJob() {
        return tjmFunctions.terasliceClient.jobs.wrap(jobId).status()
            .then((status) => {
                if (status === 'running') {
                    reply.green(`Job ${jobId} is currently running on ${cluster}, attempting to stop and restart`);
                    return tjmFunctions.terasliceClient.jobs.wrap(jobId).stop();
                }
                reply.green(`Job ${jobId} is not currently running on ${cluster}, attempting to start`);
                return Promise.resolve();
            })
            .then((newStatus) => {
                if (_.has(newStatus, 'status.status') && newStatus.status.status === 'stopped') {
                    reply.green(`stopped job ${jobId} on ${cluster}`);
                }
                return tjmFunctions.terasliceClient.jobs.wrap(jobId).start();
            })
            .then((restartResponse) => {
                    reply.green(`started job ${jobId} on ${cluster}`);
                    return restartResponse;
                });
    }

    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => tjmFunctions.terasliceClient.cluster.put(`/jobs/${jobId}`, tjmConfig.job_file_content))
        .then((updateResponse) => {
            if (_.isEmpty(updateResponse)) {
                return Promise.reject(new Error ('Could not update job'));
            }
            reply.green(`Job was updated on ${cluster}`);
            reply.green(JSON.stringify(updateResponse, null, 4));
            return Promise.resolve();
        })
        .then(() => {
            if (!tjmConfig.r) {
                return Promise.resolve();
            }
            return restartJob();
        })
        .catch(err => reply.fatal(err.message));
};
