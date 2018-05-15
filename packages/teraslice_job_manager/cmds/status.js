'use strict';

exports.command = 'status <jobFile>';
exports.desc = 'reports the job status\n';
exports.builder = (yargs) => {
    yargs.example('tjm status jobfile.prod');
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
                reply.error('Job is not on the cluster');
            }
            return Promise.resolve(true);
        })
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).status())
        .then((status) => {
            reply.success(`Job status: ${status}`);
        })
        .catch(err => reply.error(err.message));
};
