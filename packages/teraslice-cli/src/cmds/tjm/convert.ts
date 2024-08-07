import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Config from '../../helpers/config.js';
import { convertOldTJMFiles } from '../../helpers/tjm-util.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'convert <job-file...>',
    describe: 'Converts job files that used the previous version of tjm to be compatible with teraslice-cli\n',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 tjm convert JOB_FILE.json');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        convertOldTJMFiles(cliConfig);
    }
} as CMD;
