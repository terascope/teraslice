import path from 'path';
import { AssetSrc } from '../../helpers/asset-src';
import Generator from 'yeoman-generator';
import { getTemplatePath } from '../utils';

export default class extends Generator {
    constructor(args: string|string[], opts: Record<string, any>) {
        super(args, opts);
        this.argument('asset_path', { type: String, required: true });
        this.option('new', {
            type: Boolean
        });
        this.sourceRoot(getTemplatePath('registry'));
    }

    paths(): void {
        this.destinationRoot(path.join(this.options.asset_path));
    }

    // FIXME: I think this async results in errors thrown in here being lost
    async default(): Promise<void> {
        let asset
        let registry
        // find operators in asset
        try {
            asset = new AssetSrc(this.options.asset_path);
            registry = await asset.generateRegistry();
            // console.error(`${operatorFiles}`);
        } catch (error) {
            console.log(`ERROR: ${error}`)
        }
        // console.error(await findTerasliceOperators(this.options.asset_path));
        // generate registry object
        // copy over root files
        this.fs.copyTpl(this.templatePath('index.js'), this.destinationPath('index.js'),
            {
                comment: 'awesome test',
            });
    }
}
