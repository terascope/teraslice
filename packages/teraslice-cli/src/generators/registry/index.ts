import path from 'path';
import Generator from 'yeoman-generator';

import { AssetSrc } from '../../helpers/asset-src';
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
        this.destinationRoot(path.join(this.options.asset_path, 'asset'));
    }

    async default(): Promise<void> {
        const asset = new AssetSrc(this.options.asset_path);
        const registry = await asset.generateRegistry();

        this.fs.copyTpl(
            this.templatePath('index.ejs'),
            this.destinationPath('index.js'),
            { registry }
        );
    }
}
