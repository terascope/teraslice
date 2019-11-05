import AssetSrc from '../../helpers/asset-src';
import { CMD } from '../../interfaces';
import Reply from '../lib/reply';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    command: 'build',
    describe: 'Builds asset bundle.\n',
    builder(yargs) {
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('quiet', yargsOptions.buildOption('quiet'));
        // build asset found in in cwd
        // @ts-ignore
        yargs.example('$0 assets build');
        // build asset found in specified src-dir
        // @ts-ignore
        yargs.example('$0 assets build --src-dir /path/to/myAsset/');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        try {
            const asset = new AssetSrc(cliConfig.args.srcDir);
            reply.green('Beginning asset build.');
            const buildResult = await asset.build();
            reply.green(`Asset created:\n\t${buildResult}`);
        } catch (err) {
            reply.fatal(`Error building asset: ${err}`);
        }
    }
} as CMD;
