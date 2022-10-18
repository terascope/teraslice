import path from 'path';
import fs from 'fs-extra';
import assert from 'yeoman-assert';
// @ts-expect-error
import helpers from 'yeoman-test';

jest.setTimeout(20000);

describe('processor generator with no new flag', () => {
    const testAssetPath = path.join(__dirname, '..', 'fixtures', 'testAsset');
    const helpersPath = path.join(__dirname, '..', '..', 'src/index.js', 'generators', 'registry');

    beforeAll(() => helpers.run(helpersPath)
        .withArguments([testAssetPath]));

    afterAll(() => {
        fs.removeSync(path.join(__dirname, '..', 'fixtures', 'testAsset', 'asset', 'index.js'));
    });

    it('should create an index.js in the testAsset dir', () => {
        assert.file([
            path.join(testAssetPath, 'asset', 'index.js'),
        ]);
    });

    it('should create an index with correct object reference', () => {
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Processor: require(\'./proc/processor.js\')');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Schema: require(\'./proc/schema.js\')');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Slicer: require(\'./proc/slicer.js\'),');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'API: require(\'./proc2/api.js\'),');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Fetcher: require(\'./proc2/fetcher.js\'),');
        assert.fileContent(path.join(testAssetPath, 'asset', 'index.js'), 'Schema: require(\'./proc2/schema.js\'),');
    });
});
