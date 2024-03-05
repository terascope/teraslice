import { CMD } from '../../interfaces.js';
import errors from './errors.js';
import list from './list.js';
import recover from './recover.js';
import status from './status.js';
import stop from './stop.js';

export default {
    command: 'ex <command>',
    describe: 'commands to manage execution ids',
    builder(yargs) {
        return yargs.command([errors, list, recover, status, stop])
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
