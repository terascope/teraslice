'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'init <job_file>';
exports.desc = 'Initialize a new job file with an example job definition';
exports.builder = (yargs) => {
    cli().args('tjm', 'init', yargs);
    yargs
        .example('teraslice-cli tjm init example.json');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'tjm:init').returnConfigData();
    const tjm = _testFunctions || require('./lib')(cliConfig);

    return tjm.init()
        .catch(err => reply.fatal(err.message));
};
