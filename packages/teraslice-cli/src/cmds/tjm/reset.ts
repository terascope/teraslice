import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { resetConfigFile } from '../../helpers/tjm-util';

const yargsOptions = new YargsOptions();

export = {
    command: 'reset <job-file...>',
    describe: 'Removes cli metadata so job can be registerd on another cluster',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs
            .example('$0 tjm reset JOB_FILE.json', 'removes __metadata from job file and allows it to be re-registered')
            .example('$0 tjm reset JOB_FILE1.json JOB_FILE2.json', 'removes __metadata from multiple jobs file');

        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        resetConfigFile(cliConfig);
    }
} as CMD;
