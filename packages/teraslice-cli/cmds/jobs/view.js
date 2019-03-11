'use strict';
'use console';

const reply = require('../lib/reply')();

const Config = require('../../lib/config');
const YargsOptions = require('../../lib/yargs-options');
const TerasliceUtil = require('../../lib/teraslice-util');

const yargsOptions = new YargsOptions();

exports.command = 'view <cluster-alias> <id>';
exports.desc = 'View the job definition';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.strict()
        .example('$0 jobs view cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = async (argv) => {
    let response;
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);

    try {
        response = await teraslice.client.jobs.wrap(cliConfig.args.id).config();
    } catch (err) {
        reply.fatal(`> job_id:${cliConfig.args.id} not found on ${cliConfig.args.clusterAlias}`);
    }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(response, null, 4));
};
