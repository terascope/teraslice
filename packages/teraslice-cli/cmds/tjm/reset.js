'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'reset <job_file>';
exports.desc = 'Reset a job file, removes teraslice-cli metadata';
exports.builder = (yargs) => {
    cli().args('tjm', 'reset', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'tjm:reset').returnConfigData();
    const tjm = _testFunctions || require('./lib')(cliConfig);

    return tjm.reset()
        .catch(err => reply.fatal(err.message));
};
