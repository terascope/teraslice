'use strict';


const _ = require('lodash');
const reply = require('../cmd_functions/reply');
const dataChecks = require('../cmd_functions/data_checks');

exports.command = 'pause <job_file>';
exports.desc = 'pauses job on the specified cluster\n';
exports.builder = (yargs) => {
    yargs.example('tjm pause jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const tjmConfig = _.clone(argv);
    dataChecks(tjmConfig).returnJobData();
    // teraslice client functions or test functions
    const tjmFunctions = _testFunctions || require('../cmd_functions/functions')(tjmConfig);

    const jobId = tjmConfig.job_file_content.tjm.job_id;
    const { cluster } = tjmConfig;

    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(jobId).status())
        .then((jobStatus) => {
            if (jobStatus !== 'running') {
                reply.fatal(`Job ${jobId} is not running on ${cluster}.  Status is ${jobStatus}`);
            }
            return Promise.resolve();
        })
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(jobId).pause())
        .then((result) => {
            if (result.status.status === 'paused') {
                reply.green(`Paused job ${jobId} on ${cluster}`);
            } else {
                reply.fatal('Could not pause job');
            }
            return result;
        })
        .catch(err => reply.fatal(err.message));
};
