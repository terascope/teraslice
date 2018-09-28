'use strict';

const _ = require('lodash');
const reply = require('../cmd_functions/reply');
const dataChecks = require('../cmd_functions/data_checks');

exports.command = 'resume <job_file>';
exports.desc = 'resumes a paused job\n';
exports.builder = (yargs) => {
    yargs.example('earl job resume jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    dataChecks(cliConfig).returnJobData();
    const tjmFunctions = _testFunctions || require('../cmd_functions/functions')(cliConfig);

    const jobId = cliConfig.job_file_content.tjm.job_id;
    const { cluster } = cliConfig;

    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(jobId).status())
        .then((status) => {
            if (status !== 'paused') {
                reply.fatal(`Job ${jobId} is not paused on ${cluster}, but is ${status}.  Use start to start job`);
            }
            return Promise.resolve();
        })
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(jobId).resume())
        .then((resumeStatus) => {
            if (resumeStatus.status.status === 'running') {
                reply.green(`Resumed job ${jobId} on ${cluster}`);
            } else {
                reply.fatal('Could not resume job');
            }
            return resumeStatus;
        })
        .catch(err => reply.fatal(err.message));
};
