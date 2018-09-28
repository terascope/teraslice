'use strict';

const _ = require('lodash');
const reply = require('../cmd_functions/reply');
const dataChecks = require('../cmd_functions/data_checks');

exports.command = 'status <job_file>';
exports.desc = 'reports the job status\n';
exports.builder = (yargs) => {
    yargs.example('earl job status jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    dataChecks(cliConfig).returnJobData();

    const tjmFunctions = _testFunctions || require('../cmd_functions/functions')(cliConfig);

    const jobId = cliConfig.job_file_content.tjm.job_id;
    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(jobId).status())
        .then((status) => {
            reply.green(`Job status: ${status}`);
            return status;
        })
        .catch(err => reply.fatal(err.message));
};
