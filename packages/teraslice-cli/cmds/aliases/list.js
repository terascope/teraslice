'use strict';
'use console';

const reply = require('../lib/reply')();
const TerasliceCliConfig = require('../lib/teraslice-cli-config');

const Options = require('../../lib/options');

const options = new Options();
exports.command = 'list';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.options('config_dir', options.build('config_dir'));
    yargs.options('output', options.build('output'));
    yargs.strict()
        .example('teraslice-cli aliases list cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = new TerasliceCliConfig(argv);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    return libAliases.list()
        .catch(err => reply.fatal(err.message));
};
