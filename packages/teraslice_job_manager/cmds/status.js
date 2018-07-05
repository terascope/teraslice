'use strict';

const _ = require('lodash');
const reply = require('./cmd_functions/reply')();
const dataChecks = require('./cmd_functions/data_checks');

exports.command = 'status <job_file>';
exports.desc = 'reports the job status\n';
exports.builder = (yargs) => {
    yargs.example('tjm status jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const tjmConfig = _.clone(argv);
    dataChecks(tjmConfig).returnJobData();    
    
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(tjmConfig);

    const jobId = tjmConfig.job_file_content.tjm.job_id;
    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).status())
        .then((status) => {
            reply.green(`Job status: ${status}`);
            return status;
        })
        .catch(err => reply.fatal(err.message));
};
