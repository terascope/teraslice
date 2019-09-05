import { ReleaseType } from 'semver';
import { CommandModule } from 'yargs';
import { castArray } from '@terascope/utils';
import { coercePkgArg } from '../helpers/args';
import { bumpPackages } from '../helpers/bump';
import { PackageInfo } from '../helpers/interfaces';
import { syncAll } from '../helpers/sync';

const releaseChoices = ['major', 'minor', 'patch', 'prerelease', 'premajor', 'preminor', 'prepatch'];

const cmd: CommandModule = {
    command: 'bump [packages..]',
    describe: 'Update a package to specific version and its dependencies. This should be run in the root of the workspace.',
    builder(yargs) {
        return yargs
            .example('$0 bump', 'example // 0.20.0 => 0.20.1')
            .example('$0 bump', '-r patch example // 0.20.0 => 0.20.1')
            .example('$0 bump', '-r minor example // 0.5.0 => 0.6.0')
            .example('$0 bump', '-r prepatch example // 0.20.0 => 0.20.1-rc.0')
            .example('$0 bump', '-r premajor example // 0.15.0 => 1.0.0-rc.0')
            .example('$0 bump', '-r prelease example // 0.20.1-rc.0 => 0.20.1-rc.1')
            .option('prelease-id', {
                default: 'rc',
                description: 'Specify the prerelease identifier, defaults to RC',
            })
            .option('deps', {
                alias: 'd',
                description: "Bump the child dependencies, (ignores the monorepo's main package)",
                default: false,
                type: 'boolean',
            })
            .option('release', {
                alias: 'r',
                description: 'Specify the release change for the version, see https://www.npmjs.com/package/semver',
                type: 'string',
                default: 'patch',
                demandOption: true,
                choices: releaseChoices,
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
        await syncAll({ verify: true });
        return bumpPackages(argv.packages as PackageInfo[], {
            preId: argv['prelease-id'] as string | undefined,
            release: argv.release as ReleaseType,
            deps: Boolean(argv.deps),
        });
    },
};

export = cmd;
