'use strict';

const _ = require('lodash');
const reply = require('../cmd_functions/reply');
const dataChecks = require('../cmd_functions/data_checks');

exports.command = 'workers <param> <num> <job_file>';
exports.desc = 'add or remove workers to a job';
exports.builder = (yargs) => {
    yargs
        .choices('param', ['add', 'remove'])
        .example('earl job workers add 5 jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    dataChecks(cliConfig).returnJobData();

    const tjmFunctions = _testFunctions || require('../cmd_functions/functions')(cliConfig);

    const jobId = cliConfig.job_file_content.tjm.job_id;
    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => {
            if (argv.num <= 0 || _.isNaN(argv.num)) {
                return Promise.reject(new Error('Number of workers must be a positive number'));
            }
            return tjmFunctions.terasliceClient.jobs.wrap(jobId)
                .changeWorkers(cliConfig.param, cliConfig.num);
        })
        .then((workersChange) => {
            reply.green(workersChange);
            return workersChange;
        })
        .catch(err => reply.fatal(err.message));
};
