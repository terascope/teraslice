import { CMD } from '../../interfaces';

export = {
    command: 'tjm <command> <job-file>',
    describe: 'Commands to manage jobs through job files',
    builder(yargs) {
        return yargs.commandDir('.')
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
