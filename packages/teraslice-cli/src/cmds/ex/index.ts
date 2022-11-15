import { CMD } from '../../interfaces.js';

export default {
    command: 'ex <command>',
    describe: 'commands to manage execution ids',
    builder(yargs) {
        return yargs.commandDir('.')
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
