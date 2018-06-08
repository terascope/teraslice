'use strict';

exports.command = 'resume <jobFile>';
exports.desc = 'resumes a paused job\n';
exports.builder = (yargs) => {
    yargs.example('tjm resume jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    const reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobContents = jsonData.jobFileHandler(argv.jobFile)[1];
    jsonData.metaDataCheck(jobContents);
    const tjmFunctions = _testFunctions || require('./cmd_functions/functions')(argv, jobContents.tjm.cluster);
    const jobId = jobContents.tjm.job_id;
    const cluster = jobContents.tjm.cluster;

    return tjmFunctions.alreadyRegisteredCheck(jobContents)
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).status())
        .then((status) => {
            if (status !== 'paused') {
                reply.fatal(`Job ${jobId} is not paused on ${cluster}, but is ${status}.  Use start to start job`);
            }
            return Promise.resolve();
        })
        .then(() => tjmFunctions.teraslice.jobs.wrap(jobId).resume())
        .then((resumeStatus) => {
            if (resumeStatus.status.status === 'running') {
                reply.success(`Resumed job ${jobId} on ${cluster}`);
            } else {
                reply.fatal('Could not resume job');
            }
            return resumeStatus;
        })
        .catch(err => reply.fatal(err.message));
};
