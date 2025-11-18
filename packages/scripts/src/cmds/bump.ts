import { ReleaseType } from 'semver';
import { CommandModule } from 'yargs';
import { castArray } from '@terascope/core-utils';
import { coercePkgArg } from '../helpers/args.js';
import { bumpPackages } from '../helpers/bump/index.js';
import { PackageInfo } from '../helpers/interfaces.js';
import { syncAll } from '../helpers/sync/index.js';
import { getRootInfo } from '../helpers/misc.js';
import signale from '../helpers/signale.js';

const releaseChoices: readonly ReleaseType[] = [
    'patch', 'minor', 'major', 'prerelease', 'prepatch', 'preminor', 'premajor'
];

const cmd: CommandModule = {
    command: 'bump [packages..]',
    describe: 'Update a package to specific version and its dependencies. This should be run in the root of the workspace.',
    builder(yargs) {
        let y = yargs
            .example('$0 bump --patch example', '0.20.0 => 0.20.1')
            .example('$0 bump --minor example', '0.5.0 => 0.6.0')
            .example('$0 bump --prepatch example', '0.20.0 => 0.20.1-rc.0')
            .example('$0 bump --premajor example', '0.15.0 => 1.0.0-rc.0')
            .example('$0 bump --prerelease example', '0.20.1-rc.0 => 0.20.1-rc.1')
            .example('$0 bump --patch example1 example2', 'example1: 0.20.0 => 0.20.1, example2: 0.5.3 => 0.5.4')
            .option('prerelease-id', {
                default: 'rc',
                description: 'Specify the prerelease identifier, defaults to RC',
            })
            .option('skip-reset', {
                description: 'Skip resetting the packages to latest from NPM',
                type: 'boolean',
                default: false,
            })
            .option('deps', {
                alias: 'd',
                description: 'Bump the child dependencies recursively, (ignores the monorepo\'s main package)',
                default: true,
                type: 'boolean',
            });

        releaseChoices.forEach((choice, i, arr) => {
            const otherChoices = arr.filter((_item, index) => index !== i);

            y = y.option(choice, {
                description: `Bump release by ${choice}`,
                type: 'boolean',
                default: false,
                conficts: ['release', ...otherChoices],
                demandOption: true,
            });
        });

        return y.option('release', {
            alias: 'r',
            description: `Specify the release change for the version, see https://www.npmjs.com/package/semver.
            [DEPRECATED] Use --patch, --minor, --major, etc`,
            type: 'string',
            choices: releaseChoices.slice() as string[],
        })
            .positional('packages', {
                description: 'Run scripts for one or more package (if specifying more than one make sure they are ordered by dependants)',
                type: 'string',
                coerce(arg) {
                    castArray(arg).forEach((a) => {
                        if (releaseChoices.includes(a)) {
                            throw new Error(`bump CLI has changed, use --release ${a} or -r ${a} instead`);
                        }
                    });
                    return coercePkgArg(arg);
                },
            })
            .requiresArg('packages');
    },
    async handler(argv) {
        const release = getRelease(argv);
        const rootInfo = getRootInfo();

        if (rootInfo.terascope.version !== 2) {
            await syncAll({ verify: true, isAsset: rootInfo.terascope.asset });
        }

        if (rootInfo.terascope.asset) {
            signale.info('bump has detected the root directory is an Asset. bump is now in Asset mode.');
        }
        return bumpPackages({
            packages: argv.packages as PackageInfo[],
            preId: argv['prerelease-id'] as string | undefined,
            release,
            deps: Boolean(argv.deps),
            skipReset: Boolean(argv['skip-reset'])
        }, rootInfo.terascope.asset);
    },
};

function getRelease(argv: any): ReleaseType {
    const found = releaseChoices.filter((choice) => argv[choice]);
    const release = argv.release as ReleaseType | undefined;

    if (!found.length) {
        const choices = releaseChoices.map((choice) => `--${choice}`).join(', ');
        throw new Error(`Bump requires at least one of ${choices} to be specified`);
    } else if (release && found[0] && release !== found[0]) {
        throw new Error(`Cannot specify --release (DEPRECATED), use --${release} instead`);
    } else if (found.length > 1) {
        const choices = found.map((choice) => `--${choice}`).join(' and ');
        throw new Error(`Cannot specify ${choices}, pick one`);
    }

    return found[0];
}

export default cmd;
