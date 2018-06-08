'use strict';

const _ = require('lodash');

exports.command = 'update [jobFile]';
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
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobContents = jsonData.jobFileHandler(argv.jobFile)[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);
    const jobId = jobContents.tjm.job_id;
    const cluster = jobContents.tjm.cluster;

    function restartJob() {
        return tjmFunctions.teraslice.jobs.wrap(jobId).status()
            .then((status) => {
                if (status === 'running') {
                    reply.success(`Job ${jobId} is currently running on ${cluster}, attempting to stop and restart`);
                    return tjmFunctions.teraslice.jobs.wrap(jobId).stop();
                }
                reply.success(`Job ${jobId} is not currently running on ${cluster}, attempting to start`);
                return Promise.resolve();
            })
            .then((newStatus) => {
                if (_.has(newStatus, 'status.status') && newStatus.status.status === 'stopped') {
                    reply.success(`stopped job ${jobId} on ${cluster}`);
                }
                return tjmFunctions.teraslice.jobs.wrap(jobId).start();
            })
            .then((restartResponse) => {
                    reply.success(`started job ${jobId} on ${cluster}`);
                    return restartResponse;
                });
    }

    return tjmFunctions.alreadyRegisteredCheck(jobContents)
        .then(() => tjmFunctions.teraslice.cluster.put(`/jobs/${jobId}`, jobContents))
        .then((updateResponse) => {
            if (_.isEmpty(updateResponse)) {
                return Promise.reject(new Error ('Could not update job'));
            }
            reply.success(`Job was updated on ${cluster}`);
            reply.success(JSON.stringify(updateResponse, null, 4));
            return Promise.resolve();
        })
        .then(() => {
            if (!argv.r) {
                return Promise.resolve();
            }
            return restartJob();
        })
        .catch(err => reply.fatal(err.message));
};
