'use strict';

const reply = require('../lib/reply')();
const TerasliceCliConfig = require('../lib/teraslice-cli-config');
const Options = require('../../lib/yargs/options');
const Positionals = require('../../lib/yargs/positionals');

const options = new Options();
const positionals = new Positionals();

exports.command = 'update <cluster_alias> <new_cluster_url>';
exports.desc = 'Update an alias to the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster_alias', positionals.build('cluster_alias'));
    yargs.positional('new_cluster_url', positionals.build('new_cluster_url'));
    yargs.options('config_dir', options.build('config_dir'));
    yargs.options('output', options.build('output'));
    yargs
        .example('teraslice-cli aliases update cluster1 http://cluster1.net:80');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = new TerasliceCliConfig(argv);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    return libAliases.update()
        .catch(err => reply.fatal(err.message));
};
