'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'pause';
exports.desc = 'Pause all running and failing job on cluster.\n';
exports.builder = (yargs) => {
    cli().args('job', 'pause', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig).returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.pause()
        .catch(err => reply.fatal(err.message));
};
