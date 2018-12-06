'use strict';
'use console';

const Config = require('../../lib/config');

const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'list';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 aliases list cluster1');
};

exports.handler = (argv) => {
    const cliConfig = new Config(argv);
    return cliConfig.aliases.list(cliConfig.args.output);
};
