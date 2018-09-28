'use strict';


const _ = require('lodash');
const reply = require('../cmd_functions/reply');
const dataChecks = require('../cmd_functions/data_checks');

exports.command = 'pause <job_file>';
exports.desc = 'pauses job on the specified cluster\n';
exports.builder = (yargs) => {
    yargs.example('earl job pause jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    dataChecks(cliConfig).returnJobData();
    // teraslice client functions or test functions
    const tjmFunctions = _testFunctions || require('../cmd_functions/functions')(cliConfig);

    const jobId = cliConfig.job_file_content.tjm.job_id;
    const { cluster } = cliConfig;

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
