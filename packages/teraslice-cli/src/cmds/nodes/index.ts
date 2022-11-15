import { CMD } from '../../interfaces.js';

export default {
    command: 'nodes <command>',
    describe: 'commands to list nodes',
    builder(yargs) {
        return yargs.commandDir('.')
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
