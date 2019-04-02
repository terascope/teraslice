'use strict';

const path = require('path');
const fs = require('fs-extra');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('new asset generator should', () => {
    const testAssetBasePath = path.join(__dirname, '..', 'fixtures', 'generators');
    const rootAssetPath = path.join(testAssetBasePath, 'generated-asset', 'new_asset');
    const assetAssetPath = path.join(testAssetBasePath, 'generated-asset', 'new_asset', 'asset');
    const deps = [
        [helpers.createDummyGenerator(), 'addExampleProcessor: app']
    ];

    beforeAll(() => helpers.run(path.join(__dirname, '..', '..', 'generators', 'new-asset'))
        .inDir(testAssetBasePath)
        .withGenerators(deps)
        .withArguments(['generated-asset'])
        .withPrompts({
            name: 'new_asset',
            description: 'this is a new asset'
        }));

    afterAll(() => {
        fs.removeSync(path.join(__dirname, '..', 'fixtures', 'generators', 'generated-asset', 'new_asset'));
    });

    it('should create the correct asset dir tree and put files in the correct dir', () => {
        assert.file([
            path.join(rootAssetPath, 'package.json'),
            path.join(rootAssetPath, '.eslintrc'),
            path.join(rootAssetPath, '.editorconfig'),
            path.join(rootAssetPath, 'README.md'),
            path.join(assetAssetPath, 'package.json'),
            path.join(assetAssetPath, 'asset.json')
        ]);
    });

    it('should modify the file content with the name and description', () => {
        assert.jsonFileContent(path.join(rootAssetPath, 'package.json'), { name: 'new_asset' });
        assert.jsonFileContent(path.join(rootAssetPath, 'package.json'), { description: 'this is a new asset' });
        assert.jsonFileContent(path.join(rootAssetPath, 'package.json'), { version: '0.0.1' });
        assert.jsonFileContent(path.join(assetAssetPath, 'package.json'), { name: 'new_asset' });
        assert.jsonFileContent(path.join(assetAssetPath, 'package.json'), { description: 'this is a new asset' });
        assert.jsonFileContent(path.join(assetAssetPath, 'package.json'), { version: '0.0.1' });
        assert.jsonFileContent(path.join(assetAssetPath, 'asset.json'), { name: 'new_asset' });
        assert.jsonFileContent(path.join(assetAssetPath, 'asset.json'), { description: 'this is a new asset' });
        assert.jsonFileContent(path.join(assetAssetPath, 'asset.json'), { version: '0.0.1' });
    });
});
