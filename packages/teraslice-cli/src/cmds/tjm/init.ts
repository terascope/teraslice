import Config from '../../helpers/config.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import { validateJobFile, saveConfig } from '../../helpers/tjm-util.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'init <job-file...>',
    describe: 'Create a new job config file with example job definitions',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 tjm init NEW_JOB_FILE.json');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        for (const jobFile of cliConfig.args.jobFile) {
            const jobConfig = {
                name: 'data-generator',
                lifecycle: 'persistent',
                workers: 3,
                assets: ['elasticsearch', 'standard'],
                apis: [
                    {
                        _name: 'elasticsearch_sender_api',
                        size: 5000,
                        index: 'example-logs',
                        type: 'events'
                    }
                ],
                operations: [
                    {
                        _op: 'data_generator',
                        size: 5000
                    },
                    {
                        _op: 'elasticsearch_bulk',
                        _api_name: 'elasticsearch_sender_api'

                    }
                ]
            };

            validateJobFile(jobConfig as unknown as any);
            saveConfig(cliConfig.args.srcDir, jobFile, jobConfig);
            reply.green(`Created ${jobFile} file at ${cliConfig.args.srcDir}`);
        }
    }
} as CMD;
