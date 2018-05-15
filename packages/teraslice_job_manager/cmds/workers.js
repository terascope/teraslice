'use strict';

exports.command = 'workers <param> <num> <jobFile>';
exports.desc = 'add or remove workers to a job';
exports.builder = (yargs) => {
    yargs
        .choices('param', ['add', 'remove'])
        .example('tjm workers add 5 jobfile.prod');
};
exports.handler = (argv) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobContents = jsonData.jobFileHandler(argv.jobFile)[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);
    const jobId = jobContents.tjm.job_id;
    Promise.resolve()
        .then(() => tjmFunctions.alreadyRegisteredCheck(jobContents))
        .then((result) => {
            if (result === false) {
                reply.error(`Job is not on ${jobContents.tjm.cluster}`);
            }
            return Promise.resolve(true);
        })
        .then(() => {
            if (argv.num <= 0 || isNaN(argv.num)) {
                throw Error('Number of workers must be a number or greater than 0');
            }
            return tjmFunctions.teraslice.jobs.wrap(jobId).changeWorkers(argv.param, argv.num);
        })
        .then(result => reply.success(result))
        .catch(err => reply.error(err.message));
};
