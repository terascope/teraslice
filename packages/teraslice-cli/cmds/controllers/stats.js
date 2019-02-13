'use strict';

const reply = require('../lib/reply')();
const display = require('../lib/display')();

const Config = require('../../lib/config');
const TerasliceUtil = require('../../lib/teraslice-util');

const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'stats <cluster-alias> [id]';
exports.desc = 'Show stats of the controller(s) on a cluster.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 controllers stats cluster1');
};

exports.handler = async (argv) => {
    let response;
<<<<<<< HEAD
    const parse = false;
    const active = false;
=======
>>>>>>> b82a318bf8a792f9ceac561cfc5ea2879ef3d4f6
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);

    const format = `${cliConfig.args.output}Vertical`;
<<<<<<< HEAD

=======
>>>>>>> b82a318bf8a792f9ceac561cfc5ea2879ef3d4f6
    const header = 'job_id';

    // older versions of teraslice do not have contollers end point
    try {
        response = await teraslice.client.cluster.controllers();
    } catch (e) {
        response = await teraslice.client.cluster.slicers();
    }

    if (Object.keys(response).length === 0) {
        reply.fatal(`> No controllers on ${cliConfig.args.clusterAlias}`);
    }

<<<<<<< HEAD
    await display.display(header, response, format, parse, active);
=======
    await display.display(header, response, format);
>>>>>>> b82a318bf8a792f9ceac561cfc5ea2879ef3d4f6
};
