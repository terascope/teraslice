'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'view <job_file>';
exports.desc = 'View the job file definition on cluster';
exports.builder = (yargs) => {
    cli().args('tjm', 'view', yargs);
    yargs
        .example('teraslice-cli view test.json');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'tjm:view').returnConfigData();
    const tjm = _testFunctions || require('./lib')(cliConfig);

    return tjm.view()
        .catch(err => reply.fatal(err.message));
};
