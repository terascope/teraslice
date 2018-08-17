'use strict';

const _ = require('lodash');
const reply = require('./cmd_functions/reply');
const dataChecks = require('./cmd_functions/data_checks');

exports.command = 'view [job_file]';
exports.desc = 'Displays the job file as saved on the cluster specified in the tjm data';
exports.builder = (yargs) => {
    yargs.example('tjm view jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const tjmConfig = _.clone(argv);
    dataChecks(tjmConfig).returnJobData();
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(tjmConfig);

    const jobId = tjmConfig.job_file_content.tjm.job_id;
    return tjmFunctions.alreadyRegisteredCheck()
        .then(() => tjmFunctions.terasliceClient.jobs.wrap(jobId).spec())
        .then((jobSpec) => {
            reply.yellow(`Current Job File on Cluster ${tjmConfig.cluster}:`);
            reply.green(JSON.stringify(jobSpec, null, 4));
            return jobSpec;
        })
        .catch(err => reply.fatal(err.stack));
};
