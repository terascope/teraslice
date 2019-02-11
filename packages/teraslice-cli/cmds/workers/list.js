'use strict';

const reply = require('../lib/reply')();
const display = require('../lib/display')();

const Config = require('../../lib/config');

const TerasliceUtil = require('../../lib/teraslice-util');

const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'list <cluster-alias> [id]';
exports.desc = 'List the workers in a cluster\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 workers list cluster1')
        .example('$0 workers list cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = async (argv) => {
    let response;
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);

    let header = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
    const format = `${cliConfig.args.output}Horizontal`;

    if (await teraslice.type() === 'kubernetes') {
        // total and pid are n/a with kubernetes, so they are removed from the output
        header = ['assignment', 'job_id', 'ex_id', 'node_id', 'worker_id', 'teraslice_version'];
    }

    try {
        response = await teraslice.client.cluster.state();
    } catch (err) {
        reply.fatal(`Error getting cluster state on ${cliConfig.args.clusterAlias}\n${err}`);
    }

    if (Object.keys(response).length === 0) {
        reply.fatal(`> No workers on ${cliConfig.args.clusterAlias}`);
    }
    const rows = teraslice.parseStateResponse(response, header, cliConfig.args.id);

    if (rows.length > 0) {
        await display.display(header, rows, format);
    } else {
        reply.fatal(`> No workers match id ${cliConfig.args.id}`);
    }
};
