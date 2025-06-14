import path from 'node:path';
import fs from 'fs-extra';
import EJS from 'ejs';
import { AssetSrc } from '../../helpers/asset-src.js';
import { getTemplatePath } from '../utils.js';
import reply from '../../helpers/reply.js';

/**
 * Generates an index file within the asset directory of an asset bundle,
 * ensuring ESBuild bundles all asset resources
 * @param {string} assetBaseDir base directory of the asset bundle
 */
export async function generateRegistry(assetBaseDir: string): Promise<void> {
    try {
        const asset = new AssetSrc(assetBaseDir);
        const [registry, fileExt] = await asset.generateRegistry();
        const templatePath = path.join(getTemplatePath('registry'), `index-${fileExt}.ejs`);
        const templateString = fs.readFileSync(templatePath, 'utf8');
        const compiledTemplate = EJS.compile(templateString);
        const renderedRegistry = compiledTemplate({ registry });

        const destination = fileExt === 'js' ? path.join(assetBaseDir, 'asset', 'index.js') : path.join(assetBaseDir, 'asset', 'src', 'index.ts');
        fs.writeFileSync(destination, renderedRegistry);
        reply.green('Registry successfully updated');
    } catch (err) {
        throw new Error(`Failed to generate Registry: ${err}`);
    }
}
