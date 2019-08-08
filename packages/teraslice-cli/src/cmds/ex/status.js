'use strict';
'use console';

const reply = require('../lib/reply')();

const Config = require('../../lib/config');
const TerasliceUtil = require('../../lib/teraslice-util');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'status <cluster-alias> <id>';
exports.desc = 'Get the status of an execution id.\n';

exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.strict()
        .example('$0 ex status cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = async (argv) => {
    let response;
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);

    try {
        response = await teraslice.client.ex.status(cliConfig.args.id);
    } catch (err) {
        reply.fatal(`Error getting ex_id:${cliConfig.args.id} on ${cliConfig.args.clusterAlias}\n${err}`);
    }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(response, null, 2));
};
