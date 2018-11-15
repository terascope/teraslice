'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('./lib/cli');
exports.command = 'register <job_file>';
exports.desc = 'Register a job file on a cluster';
exports.builder = (yargs) => {
    cli().args('tjm', 'register', yargs);
    yargs
        .option('cluster', {
            alias: 'c',
            default: 'http://localhost:5678'
        })
        .option('run', {
            alias: 'r',
            describe: 'option to run the job immediately after being registered',
            default: false,
            type: 'boolean'
        })
        .option('asset', {
            alias: 'a',
            describe: 'builds the assets and deploys to cluster, optional',
            default: false,
            type: 'boolean'
        })
        .example('teraslice-cli tjm register jobfile.json')
        .example('teraslice-cli tjm register jobfile')
        .example('teraslice-cli tjm register jobfile.json --run -c mycluster');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig, 'tjm:register').returnConfigData();
    const tjm = _testFunctions || require('./lib')(cliConfig);

    return tjm.register()
        .catch(err => reply.fatal(err.message));
};
