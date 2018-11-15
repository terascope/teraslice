'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'stop <job_file>';
exports.desc = 'Stop job specified in job file on cluster';
exports.builder = (yargs) => {
    cli().args('tjm', 'stop', yargs);
    yargs
        .example('teraslice-cli stop test1.json');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'tjm:stop').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.stop()
        .catch(err => reply.fatal(err.message));
};
