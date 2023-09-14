import { ReleaseType } from 'semver';
import { CommandModule } from 'yargs';
import { castArray } from '@terascope/utils';
import { coercePkgArg } from '../helpers/args';
import { bumpAssetOnly } from '../helpers/bump';
import { PackageInfo } from '../helpers/interfaces';
import { syncAll } from '../helpers/sync';
import { getRootInfo } from '../helpers/misc';
import signale from '../helpers/signale';

const releaseChoices: readonly ReleaseType[] = [
    'patch', 'minor', 'major', 'prerelease', 'prepatch', 'preminor', 'premajor'
];

const cmd: CommandModule = {
    command: 'bump-asset',
    describe: 'Update an asset to specific version. This should be run in the root of the workspace.',
    builder(yargs) {
        let y = yargs
            .example('$0 bump-asset', 'asset // 0.20.0 => 0.20.1') // FixMe: change asset to ???
            .example('$0 bump-asset', '--patch asset // 0.20.0 => 0.20.1')
            .example('$0 bump-asset', '--minor asset // 0.5.0 => 0.6.0')
            .example('$0 bump-asset', '--prepatch asset // 0.20.0 => 0.20.1-rc.0')
            .example('$0 bump-asset', '--premajor asset // 0.15.0 => 1.0.0-rc.0')
            .example('$0 bump-asset', '--prerelease asset // 0.20.1-rc.0 => 0.20.1-rc.1')
            .option('prerelease-id', {
                default: 'rc',
                description: 'Specify the prerelease identifier, defaults to RC',
            })
            .option('skip-reset', { // FixMe: remove this????
                description: 'Skip resetting the packages to latest from NPM',
                type: 'boolean',
                default: false,
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

        return y;
    },
    async handler(argv) {
        const release = getRelease(argv);
        const rootInfo = getRootInfo();

        // FixMe: necessary?
        await syncAll({ verify: true, tsconfigOnly: rootInfo.terascope.version === 2 });

        if (!rootInfo.terascope.asset) {
            signale.error('Bump-asset must be run in the root directory of an Asset.');
            return;
        }
        return bumpAssetOnly({
            preId: argv['prerelease-id'] as string | undefined,
            release,
            skipReset: Boolean(argv['skip-reset']) // FixMe: necessary?
        });
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
