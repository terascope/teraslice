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
            .example('$0 publish', '-t tag docker')
            .example('$0 publish', '-t dev docker')
            .example('$0 publish', '-t latest docker')
            .example('$0 publish', '--dry-run docker')
            .example('$0 publish', '-t tag npm')
            .example('$0 publish', '-t latest npm')
            .example('$0 publish', '--dry-run npm')
            .option('dry-run', {
                description: "For testing purposes, don't pushing or publishing",
                type: 'boolean',
                default: !isCI,
            })
            .option('release-type', {
                alias: 't',
                description: 'Depending on the publish action this can be used to define what type of action to take',
                type: 'string',
                default: 'latest',
                choices: ['latest', 'dev', 'tag']
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
