import { CMD } from '../../interfaces.js';
import awaitCmd from './await.js';
import convert from './convert.js';
import errors from './errors.js';
import init from './init.js';
import pause from './pause.js';
import register from './register.js';
import reset from './reset.js';
import restart from './restart.js';
import resume from './resume.js';
import start from './start.js';
import status from './status.js';
import stop from './stop.js';
import update from './update.js';
import view from './view.js';
import workers from './workers.js';

const commandList = [
    awaitCmd,
    convert,
    errors,
    init,
    pause,
    register,
    reset,
    restart,
    resume,
    start,
    status,
    stop,
    update,
    view,
    workers
];

export default {
    command: 'tjm <command> <job-file>',
    describe: 'Commands to manage jobs through job files',
    builder(yargs) {
        return yargs.command(commandList)
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
