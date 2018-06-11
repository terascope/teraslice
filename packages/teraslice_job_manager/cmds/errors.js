'use strict';

exports.command = 'errors <jobFile>';
exports.desc = 'Shows the errors for a job\n';
exports.builder = (yargs) => {
    yargs.example('tjm errors jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobContents = jsonData.jobFileHandler(argv.jobFile)[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);
    const jobId = jobContents.tjm.job_id;

    return tjmFunctions.alreadyRegisteredCheck(jobContents)
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
