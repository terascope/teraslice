'use strict';

const reply = require('../lib/reply')();
const TerasliceCliConfig = require('../lib/teraslice-cli-config');
const Options = require('../../lib/options');

const options = new Options();

exports.command = 'update <cluster_alias> <cluster_url>';
exports.desc = 'Update an alias to the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster_alias', options.build('cluster_alias'));
    yargs.positional('cluster_url', options.build('cluster_url'));
    yargs.options('config_dir', options.build('config_dir'));
    yargs.options('output', options.build('output'));
    yargs
        .example('teraslice-cli aliases update cluster1 http://cluster1.net:80');
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
