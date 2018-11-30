'use strict';

const reply = require('../lib/reply')();
const TerasliceCliConfig = require('../lib/teraslice-cli-config');
const Options = require('../../lib/options');

const options = new Options();

exports.command = 'remove  <cluster_alias>';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster_alias', options.build('cluster_alias'));
    yargs.options('config_dir', options.build('config_dir'));
    yargs.options('output', options.build('output'));
    yargs.example('teraslice-cli aliases remove cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = new TerasliceCliConfig(argv);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    return libAliases.remove()
        .catch(err => reply.fatal(err.message));
};
