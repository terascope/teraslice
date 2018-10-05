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
    yargs
        .demandCommand(1)
        .option('annotate', {
            alias: 'n',
            describe: 'add grafana annotation',
            default: ''
        })
        .option('all', {
            alias: 'a',
            describe: 'pause all running/failing jobs',
            default: false
        })
        .example('earl jobs pause cluster1:job:99999999-9999-9999-9999-999999999999')
        .example('earl jobs pause cluster1:job:99999999-9999-9999-9999-999999999999 --yes')
        .example('earl jobs pause cluster1 --all');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig).returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.pause()
        .catch(err => reply.fatal(err.message));
};
