'use strict';


const reply = require('./cmd_functions/reply')();
const dataChecks = require('./cmd_functions/data_checks');
const _ = require('lodash');

exports.command = 'errors <job_file>';
exports.desc = 'Shows the errors for a job\n';
exports.builder = (yargs) => {
    yargs.example('tjm errors jobfile.prod');
};

exports.handler = (argv, _testFunctions) => {
    const tjmConfig = _.clone(argv);
    dataChecks(tjmConfig).returnJobData();
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(tjmConfig);

    const jobId = tjmConfig.job_file_content.tjm.job_id;

    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).errors())
        .then((errors) => {
            if (errors.length === 0) {
                reply.green('This job has no errors');
            } else {
                errors.forEach((error) => {
                    reply.yellow(JSON.stringify(error, null, 4));
                });
            }
            return errors
        })
        .catch(err => reply.fatal(err.message));
};
