
import { CMD } from '../../interfaces';

export = {
    command: 'workers <command>',
    describe: 'commands to manage worker',
    exclude: 'lib',
    builder(yargs) {
        return yargs.commandDir('.')
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
