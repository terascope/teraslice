import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { GlobalCMDOptions } from '../helpers/interfaces';
import { PublishAction } from '../helpers/publish/interfaces';
import { publish } from '../helpers/publish';

type Options = {
    'release-type'?: string;
    action: PublishAction;
    'dry-run': boolean;
};

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'publish <action>',
    describe: 'Publish npm or docker releases',
    builder(yargs) {
        return yargs
            .option('dry-run', {
                description: "For testing purposes, don't pushing or publishing",
                type: 'boolean',
                default: !isCI,
            })
            .option('release-type', {
                alias: 't',
                description: 'Depending on the publish action this can be used to define what type of action to take',
                type: 'string',
            })
            .positional('action', {
                description: 'The publish action to take',
                choices: Object.values(PublishAction),
                coerce(arg): PublishAction {
                    return arg;
                },
            })
            .requiresArg('action');
    },
    handler(argv) {
        return publish(argv.action, {
            releaseType: argv['release-type'],
            dryRun: argv['dry-run'],
        });
    },
};

export = cmd;
