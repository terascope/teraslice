'use strict';
'use console';

const reply = require('../lib/reply')();
const display = require('../lib/display')();

const Config = require('../../lib/config');
const TerasliceUtil = require('../../lib/teraslice-util');

const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'errors <cluster-alias> [id]';
exports.desc = 'List errors for all running and failing job on cluster.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.options('from', yargsOptions.buildOption('jobs-from'));
    yargs.options('size', yargsOptions.buildOption('jobs-size'));
    yargs.options('sort', yargsOptions.buildOption('jobs-sort'));
    yargs.strict()
        .example('$0 job errors cluster1 99999999-9999-9999-9999-999999999999')
        .example('$0 job errors cluster1 99999999-9999-9999-9999-999999999999 --from=500')
        .example('$0 job errors cluster1 99999999-9999-9999-9999-999999999999 --size=10')
        .example('$0 job errors cluster1 99999999-9999-9999-9999-999999999999 --sort=slicer_order:asc');
};

exports.handler = async (argv) => {
    let response;
    const active = false;
    const parse = false;
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);
    const header = ['ex_id', 'slice_id', 'slicer_id', 'slicer_order', 'state', 'ex_id', '_created', '_updated', 'error'];
    const format = `${cliConfig.args.output}Horizontal`;

    try {
        const opts = {};
        opts.from = cliConfig.args.from;
        opts.sort = cliConfig.args.sort;
        opts.size = cliConfig.args.size;
        response = await teraslice.client.jobs.wrap(cliConfig.args.id).errors(opts);
    } catch (err) {
        reply.fatal(`Error getting job errors list on ${cliConfig.args.clusterAlias}\n${err}`);
    }
    const rows = await display.parseResponse(header, response, active);
    if (rows.length > 0) {
        await display.display(header, rows, format, active, parse);
    } else {
        reply.fatal(`> No errors for job_id: ${cliConfig.args.id}`);
    }
};
