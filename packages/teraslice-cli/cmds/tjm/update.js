'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'update <job_file>';
exports.desc = 'Update cluster with local job file';
exports.builder = (yargs) => {
    cli().args('tjm', 'update', yargs);
    yargs
        .example('teraslice-cli tjm update test.json');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'tjm:update').returnConfigData();
    const tjm = _testFunctions || require('./lib')(cliConfig);

    return tjm.update()
        .catch(err => reply.fatal(err.message));
};
