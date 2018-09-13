'use strict';

const _ = require('lodash');
const reply = require('../cmd_functions/reply');
const dataChecks = require('../cmd_functions/data_checks');

exports.command = 'stop <job_file>';
exports.desc = 'stops job on the cluster in the job file\n';
exports.builder = (yargs) => {
    yargs.example('tjm stop jobfile.prod.json');
};
exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    dataChecks(cliConfig).returnJobData();
    const tjmFunctions = _testFunctions || require('../cmd_functions/functions')(cliConfig);

    const jobId = cliConfig.job_file_content.tjm.job_id;
    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(jobId).stop())
        .then((stopResponse) => {
            if (!stopResponse.status.status === 'stopped') {
                return Promise.reject(new Error('Job could not be stopped'));
            }
            reply.green(`Stopped job ${jobId} on ${cliConfig.cluster}`);
            return stopResponse;
        })
        .catch(err => reply.fatal(err));
};
