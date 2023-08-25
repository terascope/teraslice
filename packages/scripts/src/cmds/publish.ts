import { CommandModule } from 'yargs';
import { isCI } from '@terascope/utils';
import { GlobalCMDOptions } from '../helpers/interfaces';
import { PublishAction, PublishType } from '../helpers/publish/interfaces';
import { publish } from '../helpers/publish';
import { syncAll } from '../helpers/sync';
import { getRootInfo } from '../helpers/misc';

interface Options {
    type: PublishType;
    action?: PublishAction;
    'dry-run': boolean;
    'publish-outdated-packages': boolean;
    'node-version': string|undefined;
}

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'publish <action>',
    describe: 'Publish npm or docker releases',
    builder(yargs) {
        return yargs
            .example('$0 publish', '-t tag docker')
            .example('$0 publish', '-t dev docker')
            .example('$0 publish', '-t latest docker')
            .example('$0 publish', '-n 18.16.0 -t latest docker')
            .example('$0 publish', '--dry-run docker')
            .example('$0 publish', '-n 18.16.0 --dry-run docker')
            .example('$0 publish', '-t tag npm')
            .example('$0 publish', '-t latest npm')
            .example('$0 publish', '--dry-run npm')
            .example('$0 publish', '--skip-reset npm')
            .option('dry-run', {
                description: "For testing purposes, don't pushing or publishing",
                type: 'boolean',
                default: !isCI,
            })
            .option('publish-outdated-packages', {
                description: 'Publish packages that may have newer versions',
                type: 'boolean',
                default: false,
            })
            .option('type', {
                alias: 't',
                description: 'Depending on the publish action this can be used to define what type of action to take',
                type: 'string',
                default: PublishType.Latest,
                choices: Object.values(PublishType),
            })
            .option('node-version', {
                alias: 'n',
                description: 'Node version, there must be a Docker base image with this version (e.g. 18.16.0)',
                type: 'string'
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
    async handler(argv) {
        const rootInfo = getRootInfo();
        await syncAll({ verify: true, tsconfigOnly: rootInfo.terascope.version === 2 });
        return publish(argv.action!, {
            type: argv.type,
            dryRun: argv['dry-run'],
            publishOutdatedPackages: argv['publish-outdated-packages'],
            nodeVersion: argv['node-version'],
        });
    },
};

export = cmd;
