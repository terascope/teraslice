import { ReleaseType } from 'semver';
import { CommandModule } from 'yargs';
import { bumpAssetOnly } from '../helpers/bump';
import { syncAll } from '../helpers/sync';
import { getRootInfo } from '../helpers/misc';
import signale from '../helpers/signale';

const releaseChoices: readonly ReleaseType[] = [
    'patch', 'minor', 'major', 'prerelease', 'prepatch', 'preminor', 'premajor'
];

const cmd: CommandModule = {
    command: 'bump-asset',
    describe: 'Update only the asset version.\nThis is for changes in the asset code. Changes in packages should use the bump command.\nThis will update the version number in \'./package.json\', \'./asset/asset.json\', and \'./asset/package.json\'.\nThis should be run in the root of the workspace.',
    builder(yargs) {
        let y = yargs
            .example('$0 bump-asset', '--patch // 0.20.0 => 0.20.1')
            .example('$0 bump-asset', '--minor // 0.5.0 => 0.6.0')
            .example('$0 bump-asset', '--prepatch // 0.20.0 => 0.20.1-rc.0')
            .example('$0 bump-asset', '--premajor // 0.15.0 => 1.0.0-rc.0')
            .example('$0 bump-asset', '--prerelease // 0.20.1-rc.0 => 0.20.1-rc.1')
            .option('prerelease-id', {
                default: 'rc',
                description: 'Specify the prerelease identifier, defaults to RC',
            });

        releaseChoices.forEach((choice, i, arr) => {
            const otherChoices = arr.filter((_item, index) => index !== i);

            y = y.option(choice, {
                description: `Bump asset to next ${choice} version`,
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

        if (!rootInfo.terascope.asset) {
            signale.error('Bump-asset must be run in the root directory of an Asset.');
            return;
        }

        await syncAll({
            verify: true,
            tsconfigOnly: rootInfo.terascope.version === 2,
            isAsset: true
        });

        return bumpAssetOnly({
            preId: argv['prerelease-id'] as string | undefined,
            release
        }, rootInfo.terascope.asset);
    },
};

function getRelease(argv: any): ReleaseType {
    const found = releaseChoices.filter((choice) => argv[choice]);
    const release = argv.release as ReleaseType | undefined;

    if (!found.length) {
        const choices = releaseChoices.map((choice) => `--${choice}`).join(', ');
        // signale.error(`Bump requires at least one of ${choices} to be specified`);
        // process.exit(1);
        throw new Error(`Bump requires at least one of ${choices} to be specified`);
    } else if (release && found[0] && release !== found[0]) {
        // signale.error(`Cannot specify --release (DEPRECATED), use --${release} instead`);
        // process.exit(1);
        throw new Error(`Cannot specify --release (DEPRECATED), use --${release} instead`);
    } else if (found.length > 1) {
        const choices = found.map((choice) => `--${choice}`).join(' and ');
        // signale.error(`Cannot specify ${choices}, pick one`);
        // process.exit(1);
        throw new Error(`Cannot specify ${choices}, pick one`);
    }

    return found[0];
}

export = cmd;
