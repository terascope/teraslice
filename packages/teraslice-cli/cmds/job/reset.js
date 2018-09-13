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
    const cliConfig = _.clone(argv);
    dataChecks(cliConfig).returnJobData(true);
    delete cliConfig.job_file_content.tjm;
    return fs.writeJson(cliConfig.job_file_path, cliConfig.job_file_content, { spaces: 4 })
        .then(() => reply.green(`TJM data was removed from ${cliConfig.job_file}`))
        .catch(err => reply.fatal(err.message));
};
