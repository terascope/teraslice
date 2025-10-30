import { CommandModule } from 'yargs';
import { isCI } from '@terascope/core-utils';
import { GlobalCMDOptions } from '../helpers/interfaces.js';
import { PublishAction, PublishType } from '../helpers/publish/interfaces.js';
import { publish } from '../helpers/publish/index.js';
import { syncAll } from '../helpers/sync/index.js';
import { getRootInfo } from '../helpers/misc.js';
import { NODE_VERSION } from '../helpers/config.js';

interface Options {
    type: PublishType;
    action?: PublishAction;
    'dry-run': boolean;
    'node-suffix': boolean;
    'publish-outdated-packages': boolean;
    'node-version': string;
}

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'publish <action>',
    describe: 'Publish npm or docker releases',
    builder(yargs) {
        return yargs
            .example('$0 publish', '-t tag docker')
            .example('$0 publish', '-t dev docker')
            .example('$0 publish', '-t latest docker')
            .example('$0 publish', '-n 18.18.2 -t latest docker')
            .example('$0 publish', '--dry-run docker')
            .example('$0 publish', '-n 18.18.2 --dry-run docker')
            .example('$0 publish', '-t tag --node-suffix=false docker')
            .example('$0 publish', '-t tag npm')
            .example('$0 publish', '-t latest npm')
            .example('$0 publish', '--dry-run npm')
            .example('$0 publish', '--skip-reset npm')
            .option('dry-run', {
                description: 'For testing purposes, don\'t pushing or publishing',
                type: 'boolean',
                default: !isCI,
            })
            .option('node-suffix', {
                description: 'Choose whether to include or exclude a node suffix with a docker image tag',
                type: 'boolean',
                default: true,
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
                description: 'Node version, there must be a Docker base image with this version (e.g. 18.18.2)',
                type: 'string',
                default: NODE_VERSION
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
        if (rootInfo.terascope.version !== 2) {
            await syncAll({ verify: true });
        }
        return publish(argv.action!, {
            type: argv.type,
            dryRun: argv['dry-run'],
            nodeSuffix: argv['node-suffix'],
            publishOutdatedPackages: argv['publish-outdated-packages'],
            nodeVersion: argv['node-version'],
        });
    },
};

export default cmd;
