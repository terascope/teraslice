'use strict';

const _ = require('lodash');

exports.command = 'start <jobFile>';
exports.desc = 'Starts job on the cluster in the job file\n';
exports.builder = (yargs) => {
    yargs.example('tjm start jobfile.prod.json');
};
exports.handler = (argv) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobContents = jsonData.jobFileHandler(argv.jobFile)[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);
    const jobId = jobContents.tjm.job_id;

    Promise.resolve()
        .then(() => tjmFunctions.alreadyRegisteredCheck(jobContents))
        .then((result) => {
            if (result === false) {
                reply.error(`Job is not on ${jobContents.tjm.cluster} use register or run`);
            }
            return Promise.resolve(true);
        })
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).status())
        .then((status) => {
            if (status === 'running' || status === 'paused') {
                reply.error(`Job is already running on ${jobContents.tjm.cluster}, check job status`);
            }
            return Promise.resolve(true);
        })
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).start())
        .then((result) => {
            if (_.has(result, 'job_id')) {
                reply.success(`Started job ${jobId}`);
            } else {
                reply.error('Could not start job');
            }
        })
        .catch(err => reply.error(err.message));
};
