'use strict';
'use console';

const reply = require('../lib/reply')();
const Sconfig = require('../lib/sconfig');
const appCli = require('../lib/app-cli');
const cmdCli = require('./lib/cmd-cli');

exports.command = 'remove  <cluster_alias>';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    appCli.args(yargs);
    cmdCli.args(yargs);
    yargs.example('teraslice-cli aliases remove cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = new Sconfig(argv);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    return libAliases.remove()
        .catch(err => reply.fatal(err.message));
};
