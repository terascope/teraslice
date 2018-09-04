'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const reply = require('../cmd_functions/reply');
const dataChecks = require('../cmd_functions/data_checks');

// removes tjm data from json file

exports.command = 'reset [job_file]';
exports.desc = 'Removes tjm data from job or asset file';
exports.builder = (yargs) => {
    yargs.example('tjm reset jobfile.prod');
};
exports.handler = (argv) => {
    const tjmConfig = _.clone(argv);
    dataChecks(tjmConfig).returnJobData(true);
    delete tjmConfig.job_file_content.tjm;
    return fs.writeJson(tjmConfig.job_file_path, tjmConfig.job_file_content, { spaces: 4 })
        .then(() => reply.green(`TJM data was removed from ${tjmConfig.job_file}`))
        .catch(err => reply.fatal(err.message));
};
