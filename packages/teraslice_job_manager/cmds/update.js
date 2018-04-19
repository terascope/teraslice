'use strict';

exports.command = 'update [jobFile]';
exports.desc = 'Updates the job on the cluster listed in the job file\nUse -r to run or restart the job after the update\n';
exports.builder = (yargs) => {
    yargs
        .option('r', { describe: 'option to restart the job after updating\n',
            default: false,
            type: 'boolean' })
        .example('tjm update jobfile.prod.json -r');
};
exports.handler = (argv) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')(argv.jobFile);
    const jobContents = jsonData.jobFileHandler()[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);
    const jobId = jobContents.tjm.job_id;
    const cluster = jobContents.tjm.cluster;

    Promise.resolve()
        .then(() => tjmFunctions.alreadyRegisteredCheck(jobContents))
        .then((result) => {
            if (result === false) {
                reply.error(`Job is not on ${cluster}, use register or run`);
            }
            return Promise.resolve(true);
        })
        .then(() => tjmFunctions.teraslice.cluster.put(`/jobs/${jobId}`, jobContents))
        .then((result) => {
            reply.success(`Job was updated on ${cluster}`);
            console.log(result);
        })
        .then(() => {
            if (argv.r === true) {
                return tjmFunctions.teraslice.jobs.wrap(jobId).status()
                    .then((status) => {
                        if (status === 'running') {
                            reply.success(`Job ${jobId} is currently running on ${cluster}, attempting to stop and restart`);
                            return tjmFunctions.teraslice.jobs.wrap(jobId).stop();
                        }
                        reply.success(`Job ${jobId} is not currently running on ${cluster}, attempting to start`);
                        return Promise.resolve(true);
                    })
                    .then((nstatus) => {
                        if (nstatus !== true && nstatus.status.status) {
                            reply.success(`stopped job ${jobId} on ${cluster}`);
                        }
                        return tjmFunctions.teraslice.jobs.wrap(jobId).start();
                    })
                    .then(() => reply.success(`restarted job ${jobId} on ${cluster}`));
            }
            return Promise.resolve(true);
        })
        .catch(err => reply.error(err.message));
};
