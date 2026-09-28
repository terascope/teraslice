import { CMD } from '../../interfaces.js';
import list from './list.js';

export default {
    command: 'connectors <command>',
    describe: 'commands to list connectors',
    builder(yargs) {
        return yargs.command([list])
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
