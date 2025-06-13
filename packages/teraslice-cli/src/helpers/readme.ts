import path from 'node:path';
import fs from 'fs-extra';
import { AssetSrc } from './asset-src';

/**
 * Add all APIS and Operations to the root asset bundle README.md file.
 * @param { String} assetBaseDir The baseDir from the cli config file.
 * This should be the asset bundle root directory.
 */
export async function updateReadmeOpList(assetBaseDir: string): Promise<void> {
    const asset = new AssetSrc(assetBaseDir);
    const typescript = fs.existsSync(path.join(asset.srcDir, 'tsconfig.json'));
    const fileExt = typescript ? 'ts' : 'js';
    const files = await asset.operatorFiles(fileExt);
    const readmePath = path.join(assetBaseDir, 'README.md');

    const [apisSet, operationsSet] = sortFiles(files);

    const markdown = fs.readFileSync(readmePath, 'utf8');

    // Split content by H2 headings
    const parts = markdown.split(/^## /m);
    const intro = parts[0];

    // Modify APIS and Operations sections
    const updated = parts.slice(1).map((section) => {
        const [headingLine] = section.split('\n');

        if (headingLine.trim() === 'APIS') {
            const apisContent = _generateSectionContent('apis', apisSet);
            return `${headingLine}\n\n${apisContent}\n\n`;
        } else if (headingLine.trim() === 'Operations') {
            const opContent = _generateSectionContent('operations', operationsSet);
            return `${headingLine}\n\n${opContent}\n\n`;
        } else {
            return section;
        }
    });

    const finalMarkdown = [intro, ...updated.map((s) => `## ${s}`)].join('');
    fs.writeFileSync(readmePath, finalMarkdown);
}

/**
 * Reads an array of operation file paths and sorts the
 * operation directory into the 'apis' or 'operations' set.
 * @param { String[] } files array of paths to all of the operator files
 * @returns { Set<string>[] } Array of APIS and Operations sets
 */
function sortFiles(files: string[]): Set<string>[] {
    const apisSet = new Set<string>();
    const operationsSet = new Set<string>();

    for (const file of files) {
        const parsedPath = path.parse(file);
        const opDirectory = parsedPath.dir.split(path.sep).pop();
        if (!opDirectory) {
            throw new Error(`Error: unable to get 'op_directory' from ${parsedPath}`);
        }
        if (parsedPath.name === 'schema') {
            continue;
        } else if (parsedPath.name === 'api') {
            apisSet.add(opDirectory);
        } else {
            operationsSet.add(opDirectory);
        }
    }
    return [apisSet, operationsSet];
}

/**
 * Generate the list of APIS or Operations for the root README
 * @param { string } section name of the section ('operations' or 'apis')
 * @param { Set<string> } set a set of operation or api names
 * @returns { String } README section contents - stringified list of markdown links
 */
function _generateSectionContent(section: string, set: Set<string>): string {
    return Array
        .from(set)
        .map((name) => `- [\`${name}\`](./docs/asset/${section}/${name})`)
        .join('\n');
}
