
import { CMD } from '../../interfaces';
import _ from 'lodash';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import TerasliceUtil from '../../helpers/teraslice-util';

import Reply from '../lib/reply';

const reply = new Reply();

const yargsOptions = new YargsOptions();

export = {
    command: 'stop <cluster-alias> <id>',
    describe: 'Stops ex_id that is running or failing on the cluster.\n',
    builder(yargs:any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
        .example('$0 ex stop cluster1 99999999-9999-9999-9999-999999999999');
        return yargs;
    },
    async handler(argv: any) {
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
    }
} as CMD;
