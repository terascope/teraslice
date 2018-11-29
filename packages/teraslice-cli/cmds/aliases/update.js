'use strict';
'use console';

const reply = require('../lib/reply')();
const TerasliceCliConfig = require('../lib/teraslice-cli-config');
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
    const cliConfig = new TerasliceCliConfig(argv);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    if (!(cliConfig.args.cluster_alias && cliConfig.args.cluster_url)) {
        reply.fatal('You must specify both a cluster alias and cluster URL');
    }

    return libAliases.update()
        .catch(err => reply.fatal(err.message));
};
