'use strict';

const reply = require('../lib/reply')();
const display = require('../lib/display')();

const Config = require('../../lib/config');

const YargsOptions = require('../../lib/yargs-options');
const TerasliceUtil = require('../../lib/teraslice-util');

const yargsOptions = new YargsOptions();

exports.command = 'list <cluster-alias>';
exports.desc = 'List the nodes of a cluster.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 nodes list cluster1');
};


exports.handler = async (argv) => {
    let response;
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);

    const header = ['node_id', 'state', 'hostname', 'active', 'teraslice_version', 'node_version'];
    const format = `${cliConfig.args.output}Horizontal`;

    try {
        response = await teraslice.client.cluster.state();
    } catch (err) {
        reply.fatal(`Error getting cluster state on ${cliConfig.args.clusterAlias}\n${err}`);
    }
    if (Object.keys(response).length === 0) {
        reply.fatal(`> No nodes on ${cliConfig.args.clusterAlias}`);
    }

    await display.display(header, teraslice.parseResponse(response, header), format);
};
