'use strict';

const _ = require('lodash');
const reply = require('../lib/reply')();

const Config = require('../../lib/config');
const YargsOptions = require('../../lib/yargs-options');
const TerasliceUtil = require('../../lib/teraslice-util');

const yargsOptions = new YargsOptions();

exports.command = 'stop <cluster-alias> <id>';
exports.desc = 'Stops ex_id that is running or failing on the cluster.\n';

exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 ex stop cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = async (argv) => {
    let response;
    const cliConfig = new Config(argv);
    const teraslice = new TerasliceUtil(cliConfig);

    let waitCountStop = 0;
    const waitMaxStop = 10;
    let stopTimedOut = false;

    while (!stopTimedOut) {
        if (waitCountStop >= waitMaxStop) {
            break;
        }
        try {
            response = await teraslice.client.ex.stop(cliConfig.args.id);
            stopTimedOut = true;
            if (response.status === 'stopped') {
                reply.green(`> ex_id: ${cliConfig.args.id} stopped`);
            }
        } catch (err) {
            reply.error(`> Stopping ex_id had an error [${err.message}]`);
            if (_.includes(err.message, ' no active execution context was found')) {
                stopTimedOut = true;
            } else {
                stopTimedOut = false;
            }
        }
        await _.delay(() => {}, 500);
        waitCountStop += 1;
    }
};
