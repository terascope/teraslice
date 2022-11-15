import { AssetSrc } from '../../helpers/asset-src.js';
import { CMD } from '../../interfaces.js';
import reply from '../../helpers/reply.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'build',
    describe: 'Builds asset bundle.\n',
    builder(yargs) {
        yargs.option('bundle', yargsOptions.buildOption('bundle'));
        yargs.option('bundle-target', yargsOptions.buildOption('bundle-target'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.option('debug', yargsOptions.buildOption('debug'));
        yargs.option('overwrite', yargsOptions.buildOption('overwrite'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('quiet', yargsOptions.buildOption('quiet'));
        yargs.option('dev', yargsOptions.buildOption('dev'));

        yargs.example(
            '$0 assets build',
            'build asset found in in cwd'
        );
        yargs.example(
            '$0 assets build --src-dir /path/to/myAsset/',
            'build asset found in specified src-dir'
        );
        yargs.example(
            '$0 assets build --src-dir /path/to/myAsset/ --bundle',
            'build bundle style asset found in specified src-dir'
        );
        yargs.example(
            '$0 assets build --src-dir /path/to/myAsset/ --bundle --bundle-target node14',
            'build bundle style asset for node14 found in specified src-dir'
        );
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        let buildResult;

        try {
            const asset = new AssetSrc(
                cliConfig.args.srcDir,
                cliConfig.args.dev,
                cliConfig.args.debug,
                cliConfig.args.bundle,
                cliConfig.args.bundleTarget,
                cliConfig.args.overwrite
            );

            reply.green('Beginning asset build.');
            buildResult = await asset.build();
            reply.green(`Asset created:\n\t${buildResult.name} (${buildResult.bytes})`);
        } catch (err) {
            reply.fatal(`Error building asset: ${err}`);
        }
    }
} as CMD;
