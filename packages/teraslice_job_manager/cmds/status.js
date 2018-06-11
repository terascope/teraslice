'use strict';

exports.command = 'status <jobFile>';
exports.desc = 'reports the job status\n';
exports.builder = (yargs) => {
    yargs.example('tjm status jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobContents = jsonData.jobFileHandler(argv.jobFile)[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);
    const jobId = jobContents.tjm.job_id;

    return tjmFunctions.alreadyRegisteredCheck(jobContents)
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).status())
        .then((status) => {
            reply.green(`Job status: ${status}`);
            return status;
        })
        .catch(err => reply.fatal(err.message));
};
