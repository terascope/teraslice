import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import os from 'os';
import assert from 'yeoman-assert';
// @ts-expect-error
import helpers from 'yeoman-test';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('new asset generator should', () => {
    const testAssetBasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-new-asset'));
    const rootAssetPath = path.join(testAssetBasePath, 'generated-asset', 'new_asset');
    const assetAssetPath = path.join(testAssetBasePath, 'generated-asset', 'new_asset', 'asset');

    const deps = [
        [helpers.createDummyGenerator(), 'addExampleProcessor: app']
    ];

    beforeAll(() => helpers.run(path.join(dirname, '..', '..', 'src', 'generators', 'new-asset'))
        .inDir(testAssetBasePath)
        .withGenerators(deps)
        .withArguments(['generated-asset'])
        .withPrompts({
            name: 'new_asset',
            description: 'this is a new asset'
        }));

    afterAll(() => {
        fs.rmSync(testAssetBasePath, { recursive: true, force: true });
    });

    it('should create the correct asset dir tree and put files in the correct dir', () => {
        assert.file([
            path.join(rootAssetPath, 'package.json'),
            path.join(rootAssetPath, '.eslintrc'),
            path.join(rootAssetPath, '.editorconfig'),
            path.join(rootAssetPath, 'README.md'),
            path.join(rootAssetPath, 'jest.config.js'),
            path.join(rootAssetPath, '.gitignore'),
            path.join(assetAssetPath, 'package.json'),
            path.join(assetAssetPath, 'asset.json')
        ]);
    });

    it('should modify the file content with the name and description', () => {
        assert.jsonFileContent(path.join(rootAssetPath, 'package.json'), {
            name: 'new_asset-bundle',
            description: 'this is a new asset',
            version: '0.1.0'
        });
        assert.jsonFileContent(path.join(assetAssetPath, 'package.json'), {
            name: 'new_asset',
            description: 'this is a new asset',
            version: '0.1.0'
        });
        assert.jsonFileContent(path.join(assetAssetPath, 'asset.json'), {
            name: 'new_asset',
            description: 'this is a new asset',
            version: '0.1.0'
        });
    });
});
