import { CMD } from '../../interfaces.js';
import awaitCmd from './await.js';
import deleteJob from './delete.js';
import errors from './errors.js';
import exportJob from './export.js';
import list from './list.js';
import pause from './pause.js';
import recover from './recover.js';
import restart from './restart.js';
import resume from './resume.js';
import run from './run.js';
import save from './save.js';
import start from './start.js';
import status from './status.js';
import stop from './stop.js';
import view from './view.js';
import workers from './workers.js';

const commandList = [
    awaitCmd,
    deleteJob,
    errors,
    exportJob,
    list,
    pause,
    recover,
    restart,
    resume,
    run,
    save,
    start,
    status,
    stop,
    view,
    workers
];

export default {
    command: 'jobs',
    describe: 'commands to manage job',
    exclude: 'lib',
    builder(yargs) {
        return yargs.command(commandList)
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
