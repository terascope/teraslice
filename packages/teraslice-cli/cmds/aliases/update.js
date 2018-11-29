'use strict';
'use console';

const reply = require('../lib/reply')();
const Sconfig = require('../lib/sconfig');
const appCli = require('../lib/app-cli');
const clusterUrlCli = require('../lib/cli/cluster-url');
const cmdCli = require('./lib/cmd-cli');

exports.command = 'update <cluster_alias>';
exports.desc = 'Update an alias to the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    appCli.args(yargs);
    cmdCli.args(yargs);
    clusterUrlCli.args(yargs);
    yargs
        .example('teraslice-cli aliases update cluster1 -c http://cluster1.net:80');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = new Sconfig(argv);
    const libAliases = _testFunctions || require('./lib')(cliConfig);
    return libAliases.update()
        .catch(err => reply.fatal(err.message));
};
