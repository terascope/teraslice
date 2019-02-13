'use strict';
'use console';

const reply = require('../lib/reply')();
const display = require('../lib/display')();

const Config = require('../../lib/config');
const TerasliceUtil = require('../../lib/teraslice-util');

const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'errors <cluster-alias> <id>';
exports.desc = 'Get the status of an execution id.\n';

exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.options('from', yargsOptions.buildOption('ex-from'));
    yargs.options('size', yargsOptions.buildOption('ex-size'));
    yargs.options('sort', yargsOptions.buildOption('ex-sort'));
    yargs.strict()
        .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999')
        .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --from=500')
        .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --size=10')
        .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --sort=slicer_order:asc');
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
        response = await teraslice.client.ex.errors(cliConfig.args.id, opts);
    } catch (err) {
        reply.fatal(`Error getting ex errors list on ${cliConfig.args.clusterAlias}\n${err}`);
    }


    const rows = await display.parseResponse(header, response, active);
    if (rows.length > 0) {
        await display.display(header, rows, format, active, parse);
    } else {
        reply.fatal(`> No errors for ex_id: ${cliConfig.args.id}`);
    }
};
