import { ReleaseType } from 'semver';
import { CommandModule } from 'yargs';
import { castArray } from '@terascope/utils';
import { coercePkgArg } from '../helpers/args';
import { bumpPackages } from '../helpers/bump';
import { PackageInfo } from '../helpers/interfaces';
import { syncAll } from '../helpers/sync';
import { getRootInfo } from '../helpers/misc';
import signale from '../helpers/signale';

const releaseChoices: readonly ReleaseType[] = [
    'patch', 'minor', 'major', 'prerelease', 'prepatch', 'preminor', 'premajor'
];

const cmd: CommandModule = {
    command: 'bump [packages..]',
    describe: 'Update a package to specific version and its dependencies. This should be run in the root of the workspace.',
    builder(yargs) {
        let y = yargs
            .example('$0 bump', 'example // 0.20.0 => 0.20.1')
            .example('$0 bump', '--patch example // 0.20.0 => 0.20.1')
            .example('$0 bump', '--minor example // 0.5.0 => 0.6.0')
            .example('$0 bump', '--prepatch example // 0.20.0 => 0.20.1-rc.0')
            .example('$0 bump', '--premajor example // 0.15.0 => 1.0.0-rc.0')
            .example('$0 bump', '--prerelease example // 0.20.1-rc.0 => 0.20.1-rc.1')
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
                description: "Bump the child dependencies recursively, (ignores the monorepo's main package)",
                default: true,
                type: 'boolean',
            })
            .option('skip-asset', {
                description: 'If in an asset repository, bump the package version without updating the asset version',
                default: false,
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

        await syncAll({
            verify: true,
            tsconfigOnly: rootInfo.terascope.version === 2,
            isAsset: rootInfo.terascope.asset
        });

        if (rootInfo.terascope.asset) {
            signale.warn('bump has detected the root directory is an Asset.');
            signale.note('bump is in Asset mode.');
        }
        return bumpPackages({
            packages: argv.packages as PackageInfo[],
            preId: argv['prerelease-id'] as string | undefined,
            release,
            deps: Boolean(argv.deps),
            skipReset: Boolean(argv['skip-reset']),
            skipAsset: Boolean(argv['skip-asset'])
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

export = cmd;
