'use strict';

const reply = require('../lib/reply')();
const TerasliceCliConfig = require('../lib/teraslice-cli-config');
const appCli = require('../lib/app-cli');
const cmdCli = require('./lib/cmd-cli');
const clusterUrlCli = require('../lib/cli/cluster-url');

exports.command = 'list [cluster_alias]';
exports.desc = 'List controller(s) on a cluster.\n';
exports.builder = (yargs) => {
    appCli.args(yargs);
    clusterUrlCli.args(yargs);
    cmdCli.args(yargs);
    yargs
        .example('teraslice-cli controllers list cluster1')
        .example('teraslice-cli controllers list -c http://cluster1.net:5678');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = new TerasliceCliConfig(argv);
    const controller = _testFunctions || require('./lib')(cliConfig);

    return controller.list()
        .catch(err => reply.fatal(err.message));
};
