'use strict';

const reply = require('../lib/reply')();
const display = require('../lib/display')();

const Config = require('../../lib/config');
const TerasliceUtil = require('../../lib/teraslice-util');

const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'list <cluster-alias>';
exports.desc = 'List controller(s) on a cluster.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 controllers list cluster1');
};

exports.handler = async (argv) => {
    let response;
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);

    const header = ['name', 'job_id', 'workers_available', 'workers_active', 'failed', 'queued', 'processed'];
    const format = `${cliConfig.args.output}Horizontal`;

    // older versions of teraslice do not have contollers end point
    try {
        response = await teraslice.client.cluster.controllers();
    } catch (e) {
        response = await teraslice.client.cluster.slicers();
    }
    if (Object.keys(response).length === 0) {
        reply.fatal(`> No controllers on ${cliConfig.args.clusterAlias}`);
    }

    const rows = teraslice.parseResponse(response, header);
    if (rows.length > 0) {
        await display.display(header, rows, format);
    } else {
        reply.fatal(`> No controllers match id ${cliConfig.args.id}`);
    }
};
