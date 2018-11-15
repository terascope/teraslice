'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'start <job_file>';
exports.desc = 'Start job specified in job file on cluster';
exports.builder = (yargs) => {
    cli().args('tjm', 'start', yargs);
    yargs
        .example('teraslice-cli tjm start test.json');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig, 'tjm:start').returnConfigData();
    const tjm = _testFunctions || require('./lib')(cliConfig);

    return tjm.start()
        .catch(err => reply.fatal(err.message));
};
