'use strict';
'use console';

const Config = require('../../lib/config');
const display = require('../lib/display')();
const { getTerasliceClient } = require('../../lib/utils');
const reply = require('../lib/reply')();
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'list <cluster-alias>';
exports.desc = 'List assets on a cluster.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.option('output', yargsOptions.buildOption('output'));
    yargs.example('$0 assets list ts-test1');
};

exports.handler = async (argv) => {
    let response;
    const cliConfig = new Config(argv);
    const terasliceClient = getTerasliceClient(cliConfig);
    const header = ['name', 'version', 'id', 'description', '_created'];

    try {
        response = await terasliceClient.assets.list();
    } catch (err) {
        reply.fatal(`Error listing assets on ${cliConfig.args.clusterAlias}`);
    }
    display.display(header, response, cliConfig.args.output);
};
