import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { GlobalCMDOptions } from '../helpers/interfaces';
import { PublishType } from '../helpers/publish/interfaces';
import { publish } from '../helpers/publish';

type Options = {
    type: PublishType;
    tag?: string;
    'dry-run': boolean;
};

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'publish',
    describe: 'Publish npm, docker and documentation releases',
    builder(yargs) {
        return yargs
            .option('dry-run', {
                description: "For testing purposes, don't pushing or publishing",
                type: 'boolean',
                default: !isCI,
            })
            .option('type', {
                description: 'The release type',
                demandOption: true,
                choices: Object.values(PublishType),
                coerce(arg): PublishType {
                    return arg;
                },
            })
            .option('tag', {
                description: 'The release tag',
                type: 'string',
            });
    },
    handler(argv) {
        return publish({
            type: argv.type,
            tag: argv.tag,
            dryRun: argv['dry-run'],
        });
    },
};

export = cmd;
