'use strict';

const reply = require('../lib/reply')();
const display = require('../lib/display')();

const Config = require('../../lib/config');

const YargsOptions = require('../../lib/yargs-options');
const TerasliceUtil = require('../../lib/teraslice-util');

const yargsOptions = new YargsOptions();

exports.command = 'list <cluster-alias>';
exports.desc = 'List the jobs on the cluster. Defaults to 10 jobs.';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 jobs list cluster1');
};

exports.handler = async (argv) => {
    let response;
    const active = false;
    const parse = true;
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);
    const header = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];
    const format = `${cliConfig.args.output}Horizontal`;

    try {
        response = await teraslice.client.jobs.list();
    } catch (err) {
        reply.fatal(`Error getting jobs list on ${cliConfig.args.clusterAlias}\n${err}`);
    }
    if (Object.keys(response).length === 0) {
        reply.fatal(`> No jobs on ${cliConfig.args.clusterAlias}`);
    }

    await display.display(header, response, format, active, parse);
};
