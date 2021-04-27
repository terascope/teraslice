import { AssetSrc } from '../../helpers/asset-src';
import { CMD } from '../../interfaces';
import reply from '../../helpers/reply';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';

const yargsOptions = new YargsOptions();

export = {
    command: 'build',
    describe: 'Builds asset bundle.\n',
    builder(yargs) {
        yargs.option('bundle', yargsOptions.buildOption('bundle'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
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
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        let buildResult;

        try {
            const asset = new AssetSrc(
                cliConfig.args.srcDir,
                cliConfig.args.dev,
                cliConfig.args.bundle
            );

            if (cliConfig.args.bundle) {
                reply.green('Beginning bundled asset build.');
                buildResult = await asset.buildBundle();
            } else {
                reply.green('Beginning asset build.');
                buildResult = await asset.build();
            }
            reply.green(`Asset created:\n\t${buildResult.name} (${buildResult.bytes})`);
        } catch (err) {
            reply.fatal(`Error building asset: ${err}`);
        }
    }
} as CMD;
