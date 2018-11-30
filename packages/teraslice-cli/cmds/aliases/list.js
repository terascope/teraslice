'use strict';
'use console';

const reply = require('../lib/reply')();
const TerasliceCliConfig = require('../lib/teraslice-cli-config');
const appCli = require('../lib/app-cli');
const cmdCli = require('./lib/cmd-cli');

exports.command = 'list';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    appCli.args(yargs);
    cmdCli.args(yargs);
    yargs.strict()
        .example('teraslice-cli aliases list cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = new TerasliceCliConfig(argv);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    return libAliases.list()
        .catch(err => reply.fatal(err.message));
};
