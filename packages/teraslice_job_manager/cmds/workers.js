'use strict';

const _ = require('lodash');

exports.command = 'workers <param> <num> <jobFile>';
exports.desc = 'add or remove workers to a job';
exports.builder = (yargs) => {
    yargs
        .choices('param', ['add', 'remove'])
        .example('tjm workers add 5 jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobContents = jsonData.jobFileHandler(argv.jobFile)[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);
    const jobId = jobContents.tjm.job_id;

    return tjmFunctions.alreadyRegisteredCheck(jobContents)
        .then(() => {
            if (argv.num <= 0 || _.isNaN(argv.num)) {
                return Promise.reject(new Error('Number of workers must be a positive number greater'));
            }
            return tjmFunctions.teraslice.jobs.wrap(jobId).changeWorkers(argv.param, argv.num);
        })
        .then((workersChange) => {
            reply.success(workersChange);
            return workersChange;
        })
        .catch(err => reply.fatal(err.message));
};
