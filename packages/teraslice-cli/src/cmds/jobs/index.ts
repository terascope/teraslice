import { CMD } from '../../interfaces';

export = {
    command: 'jobs',
    describe: 'commands to manage job',
    exclude: 'lib',
    builder(yargs) {
        return yargs.commandDir('.')
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
