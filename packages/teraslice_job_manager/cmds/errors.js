'use strict';

exports.command = 'errors <jobFile>';
exports.desc = 'Shows the errors for a job\n';
exports.builder = (yargs) => {
    yargs.example('tjm errors jobfile.prod');
};
exports.handler = (argv) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')(argv.jobFile);
    const jobContents = jsonData.jobFileHandler()[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);

    const jobId = jobContents.tjm.job_id;

    Promise.resolve()
        .then(() => tjmFunctions.alreadyRegisteredCheck(jobContents))
        .then((result) => {
            if (result === false) {
                return Promise.reject('Job is not on the cluster');
            }
            return Promise.resolve(true);
        })
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).errors())
        .then((errors) => {
            if (errors.length === 0) {
                reply.success('This job has no errors');
            } else {
                errors.forEach((error) => {
                    reply.warning(error);
                });
            }
        })
        .catch(err => reply.error(err.message));
};
